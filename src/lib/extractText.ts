// Client-side resume text extraction. Supports PDF, DOCX, and TXT/MD.
// All parsers are dynamically imported so they stay out of the initial bundle
// and never run on the server.

export const ACCEPTED_RESUME_TYPES = ".pdf,.docx,.txt,.md";
export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

export class ExtractionError extends Error {}

function fileIs(file: File, ext: string, mime?: string) {
  return file.name.toLowerCase().endsWith(ext) || (!!mime && file.type === mime);
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker is served as a static module from /public (copied via the
  // copy-pdf-worker script on install/build). Avoids bundling the ESM worker.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(text);
  }
  return parts.join("\n").replace(/[ \t]+/g, " ").trim();
}

async function extractDocx(file: File): Promise<string> {
  // Browser build avoids Node-only dependencies.
  const mammoth = await import("mammoth/mammoth.browser.js");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value || "").trim();
}

/**
 * Extract plain text from an uploaded resume file.
 * Throws ExtractionError with a user-friendly message on failure.
 */
export async function extractResumeText(file: File): Promise<string> {
  if (file.size > MAX_RESUME_BYTES) {
    throw new ExtractionError("That file is over 5 MB. Please upload a smaller file.");
  }

  try {
    if (fileIs(file, ".txt", "text/plain") || fileIs(file, ".md")) {
      return (await file.text()).trim();
    }
    if (
      fileIs(
        file,
        ".docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ) {
      return await extractDocx(file);
    }
    if (fileIs(file, ".pdf", "application/pdf")) {
      return await extractPdf(file);
    }
  } catch (err) {
    console.error("[extractResumeText]", err);
    throw new ExtractionError(
      "We couldn't read that file. Try a different file, or paste your resume text instead."
    );
  }

  throw new ExtractionError(
    "Unsupported file type. Please upload a PDF, DOCX, or TXT file."
  );
}
