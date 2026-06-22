"use client";

// Extract source text from an uploaded file for the presentation builder.
// PDF/DOCX reuse the same libraries as the resume flow; PPTX is unzipped with
// JSZip (lazy-loaded from CDN) and its slide text pulled from the XML.

export const ACCEPTED_DECK_TYPES = ".pdf,.docx,.txt,.md,.pptx";
export const MAX_DECK_BYTES = 15 * 1024 * 1024; // 15 MB

export class DeckExtractionError extends Error {}

const ends = (f: File, ext: string) => f.name.toLowerCase().endsWith(ext);

function loadScript(src: string, marker: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-lib="${marker}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.lib = marker;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${marker}`));
    document.head.appendChild(s);
  });
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  return parts.join("\n").replace(/[ \t]+/g, " ").trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value || "").trim();
}

async function extractPptx(file: File): Promise<string> {
  await loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js", "jszip");
  // @ts-expect-error injected by the CDN script
  const JSZip = window.JSZip;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideFiles = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      return na - nb;
    });
  const out: string[] = [];
  for (const name of slideFiles) {
    const xml: string = await zip.files[name].async("string");
    // <a:t>...</a:t> holds the visible text runs.
    const texts = Array.from(xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)).map((m) => m[1]);
    if (texts.length) out.push(texts.join(" "));
  }
  return out.join("\n\n").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

export async function extractDeckSource(file: File): Promise<string> {
  if (file.size > MAX_DECK_BYTES) {
    throw new DeckExtractionError("That file is over 15 MB. Please upload a smaller file.");
  }
  try {
    if (ends(file, ".txt") || ends(file, ".md")) return (await file.text()).trim();
    if (ends(file, ".docx")) return await extractDocx(file);
    if (ends(file, ".pdf")) return await extractPdf(file);
    if (ends(file, ".pptx")) return await extractPptx(file);
  } catch (err) {
    console.error("[extractDeckSource]", err);
    throw new DeckExtractionError("We couldn't read that file. Try another file, or paste the text instead.");
  }
  throw new DeckExtractionError("Unsupported file. Upload a PDF, DOCX, TXT, or PPTX.");
}
