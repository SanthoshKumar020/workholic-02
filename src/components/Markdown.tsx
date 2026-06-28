import React from "react";

/**
 * Minimal, dependency-free Markdown renderer for blog/SEO content.
 * Supports: ## / ### headings, paragraphs, - and 1. lists, **bold**,
 * `code`, and [text](url) links. Good enough for long-form articles
 * without pulling in react-markdown/remark.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Tokenise on **bold**, `code`, and [text](url)
  const regex = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2]) {
      nodes.push(<strong key={`${keyPrefix}-b${i}`} className="font-semibold text-slate-900">{m[2]}</strong>);
    } else if (m[4]) {
      nodes.push(<code key={`${keyPrefix}-c${i}`} className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.85em] text-brand-700">{m[4]}</code>);
    } else if (m[6] && m[7]) {
      const isInternal = m[7].startsWith("/");
      nodes.push(
        <a
          key={`${keyPrefix}-a${i}`}
          href={m[7]}
          {...(isInternal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          className="font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-700"
        >
          {m[6]}
        </a>
      );
    }
    last = regex.lastIndex;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let key = 0;

  const flushPara = () => {
    if (para.length) {
      const text = para.join(" ").trim();
      if (text) blocks.push(<p key={`p${key++}`} className="my-4 leading-relaxed text-slate-700">{renderInline(text, `p${key}`)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      const items = list.map((li, idx) => (
        <li key={`li${idx}`} className="leading-relaxed text-slate-700">{renderInline(li, `l${key}-${idx}`)}</li>
      ));
      blocks.push(
        listType === "ol"
          ? <ol key={`ol${key++}`} className="my-4 list-decimal space-y-2 pl-6 marker:text-slate-400">{items}</ol>
          : <ul key={`ul${key++}`} className="my-4 list-disc space-y-2 pl-6 marker:text-brand-400">{items}</ul>
      );
      list = [];
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); continue; }

    if (line.startsWith("### ")) {
      flushPara(); flushList();
      blocks.push(<h3 key={`h3${key++}`} className="mt-8 mb-2 text-lg font-bold text-slate-900">{renderInline(line.slice(4), `h3${key}`)}</h3>);
    } else if (line.startsWith("## ")) {
      flushPara(); flushList();
      blocks.push(<h2 key={`h2${key++}`} className="mt-10 mb-3 text-2xl font-bold tracking-tight text-slate-900">{renderInline(line.slice(3), `h2${key}`)}</h2>);
    } else if (/^\d+\.\s/.test(line)) {
      flushPara();
      if (listType === "ul") flushList();
      listType = "ol";
      list.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.startsWith("- ")) {
      flushPara();
      if (listType === "ol") flushList();
      listType = "ul";
      list.push(line.slice(2));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();

  return <div className="text-[15px]">{blocks}</div>;
}
