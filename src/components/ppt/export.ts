"use client";

import type { Deck, Slide } from "@/lib/ppt/types";
import { getTheme } from "@/lib/ppt/types";

// ── Real .pptx export via pptxgenjs (lazy-loaded from CDN, no npm dep) ────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pptxLib: any = null;

function loadScript(src: string, marker: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-lib="${marker}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.lib = marker;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load pptx library"));
    document.head.appendChild(s);
  });
}

async function getPptx() {
  if (pptxLib) return pptxLib;
  await loadScript("https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js", "pptxgenjs");
  // @ts-expect-error injected by the CDN script
  pptxLib = window.PptxGenJS;
  return pptxLib;
}

const W = 13.333;
const H = 7.5;
const M = 0.7; // margin

export async function downloadPptx(deck: Deck) {
  const PptxGenJS = await getPptx();
  const t = getTheme(deck.theme).pptx;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = deck.title;

  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    const slide = pptx.addSlide();
    slide.background = { color: t.bg };
    // accent bar
    slide.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: t.accent } });

    if (s.layout === "title" || s.layout === "closing") {
      slide.addText(s.title, { x: M, y: 2.4, w: W - 2 * M, h: 2, fontSize: 40, bold: true, color: t.text, align: "center" });
      if (s.subtitle) slide.addText(s.subtitle, { x: M, y: 4.3, w: W - 2 * M, h: 1, fontSize: 18, color: t.sub, align: "center" });
    } else if (s.layout === "section") {
      slide.addText(String(i + 1).padStart(2, "0"), { x: M, y: 1.6, w: 4, h: 1.5, fontSize: 54, bold: true, color: t.accent });
      slide.addText(s.title, { x: M, y: 3.2, w: W - 2 * M, h: 1.5, fontSize: 34, bold: true, color: t.text });
      if (s.subtitle) slide.addText(s.subtitle, { x: M, y: 4.6, w: W - 2 * M, h: 1, fontSize: 16, color: t.sub });
    } else if (s.layout === "quote") {
      slide.addText(`"${s.quote || s.title}"`, { x: M, y: 2, w: W - 2 * M, h: 3, fontSize: 30, italic: true, bold: true, color: t.text, align: "center", valign: "middle" });
      if (s.author) slide.addText(`— ${s.author}`, { x: M, y: 5.1, w: W - 2 * M, h: 0.8, fontSize: 16, color: t.sub, align: "center" });
    } else if (s.layout === "stat") {
      slide.addText(s.title, { x: M, y: 0.7, w: W - 2 * M, h: 1, fontSize: 26, bold: true, color: t.text });
      const stats = s.stats ?? [];
      const cw = (W - 2 * M) / Math.max(1, stats.length);
      stats.forEach((st, idx) => {
        const x = M + idx * cw;
        slide.addText(st.value, { x, y: 2.6, w: cw, h: 1.5, fontSize: 48, bold: true, color: t.accent, align: "center" });
        slide.addText(st.label, { x, y: 4.2, w: cw, h: 1, fontSize: 14, color: t.sub, align: "center" });
      });
    } else if (s.layout === "two-column") {
      slide.addText(s.title, { x: M, y: 0.7, w: W - 2 * M, h: 1, fontSize: 26, bold: true, color: t.text });
      const cols = (s.columns ?? []).slice(0, 2);
      const cw = (W - 2 * M - 0.5) / 2;
      cols.forEach((c, idx) => {
        const x = M + idx * (cw + 0.5);
        slide.addText(c.heading, { x, y: 1.9, w: cw, h: 0.6, fontSize: 18, bold: true, color: t.accent });
        slide.addText(
          c.points.map((p) => ({ text: p, options: { bullet: true, color: t.sub, fontSize: 15 } })),
          { x, y: 2.6, w: cw, h: 4, color: t.sub, fontSize: 15, lineSpacingMultiple: 1.2 },
        );
      });
    } else {
      // bullets (default)
      slide.addText(s.title, { x: M, y: 0.7, w: W - 2 * M, h: 1, fontSize: 28, bold: true, color: t.text });
      slide.addShape("rect", { x: M, y: 1.75, w: 1.2, h: 0.08, fill: { color: t.accent } });
      slide.addText(
        (s.bullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 18 }, color: t.text, fontSize: 18 } })),
        { x: M, y: 2.1, w: W - 2 * M, h: 4.6, color: t.text, fontSize: 18, lineSpacingMultiple: 1.3, valign: "top" },
      );
    }

    if (s.notes) slide.addNotes(s.notes);
  }

  await pptx.writeFile({ fileName: `${safeName(deck.title)}.pptx` });
}

function safeName(s: string) {
  return (s || "presentation").replace(/[^a-z0-9\- ]/gi, "").trim().slice(0, 60) || "presentation";
}

// ── PDF export via a print window (user saves as PDF) ────────────────────────

function slideHtml(s: Slide, theme: ReturnType<typeof getTheme>, idx: number): string {
  const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let body = "";
  if (s.layout === "title" || s.layout === "closing") {
    body = `<div class="mid"><div class="bar"></div><h1>${esc(s.title)}</h1>${s.subtitle ? `<p class="sub">${esc(s.subtitle)}</p>` : ""}</div>`;
  } else if (s.layout === "section") {
    body = `<div class="mid"><div class="num">${String(idx + 1).padStart(2, "0")}</div><h2>${esc(s.title)}</h2>${s.subtitle ? `<p class="sub">${esc(s.subtitle)}</p>` : ""}</div>`;
  } else if (s.layout === "quote") {
    body = `<div class="mid"><p class="quote">&ldquo;${esc(s.quote || s.title)}&rdquo;</p>${s.author ? `<p class="sub">— ${esc(s.author)}</p>` : ""}</div>`;
  } else if (s.layout === "stat") {
    const cells = (s.stats ?? []).map((st) => `<div class="stat"><div class="val">${esc(st.value)}</div><div class="sub">${esc(st.label)}</div></div>`).join("");
    body = `<h2>${esc(s.title)}</h2><div class="stats">${cells}</div>`;
  } else if (s.layout === "two-column") {
    const cols = (s.columns ?? []).map((c) => `<div class="col"><div class="ch">${esc(c.heading)}</div>${c.points.map((p) => `<div class="sub">• ${esc(p)}</div>`).join("")}</div>`).join("");
    body = `<h2>${esc(s.title)}</h2><div class="cols">${cols}</div>`;
  } else {
    const items = (s.bullets ?? []).map((b) => `<li>${esc(b)}</li>`).join("");
    body = `<h2>${esc(s.title)}</h2><div class="line"></div><ul>${items}</ul>`;
  }
  return `<section class="slide" style="background:${theme.css};color:${theme.text}"><div class="acc"></div>${body}</section>`;
}

export function printDeck(deck: Deck) {
  const theme = getTheme(deck.theme);
  const slides = deck.slides.map((s, i) => slideHtml(s, theme, i)).join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${deck.title}</title>
  <style>
    @page { size: 1280px 720px; margin: 0; }
    * { box-sizing: border-box; margin: 0; font-family: Segoe UI, system-ui, sans-serif; }
    body { background:#111; }
    .slide { position: relative; width: 1280px; height: 720px; padding: 80px; display:flex; flex-direction:column; overflow:hidden; page-break-after: always; }
    .acc { position:absolute; top:0; right:0; width:140px; height:140px; background:${theme.accent}; opacity:.18; border-bottom-left-radius:48px; }
    .mid { margin:auto; }
    h1 { font-size: 56px; font-weight: 800; line-height:1.1; }
    h2 { font-size: 38px; font-weight: 700; }
    .sub { color:${theme.sub}; font-size: 22px; margin-top: 10px; }
    .bar { width:90px;height:8px;border-radius:9px;background:${theme.accent};margin-bottom:18px; }
    .num { font-size:90px;font-weight:900;opacity:.25; }
    .line { width:70px;height:6px;border-radius:6px;background:${theme.accent};margin:14px 0 24px; }
    ul { margin-top: 10px; }
    li { font-size: 26px; margin: 14px 0; }
    .quote { font-size: 44px; font-weight: 800; line-height:1.15; }
    .stats { display:flex; justify-content:space-around; align-items:center; flex:1; }
    .stat { text-align:center; } .val { font-size: 80px; font-weight: 900; color:${theme.accent}; }
    .cols { display:flex; gap:40px; margin-top:24px; } .col { flex:1; background:rgba(255,255,255,.08); border-radius:18px; padding:28px; }
    .ch { color:${theme.accent}; font-weight:700; font-size:24px; margin-bottom:12px; }
  </style></head><body>${slides}<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
  w.document.close();
}
