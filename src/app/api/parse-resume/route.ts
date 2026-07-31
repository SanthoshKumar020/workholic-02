import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * This endpoint is intentionally anonymous — it backs the no-signup resume
 * upload. That makes it the easiest way to burn our compute: it feeds
 * arbitrary bytes into unpdf/mammoth inside a 30-second Node lambda. A
 * decompression-bomb PDF posted in a loop is a denial-of-wallet attack, so it
 * needs both a size cap and a request cap.
 */
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB — matches the UI's stated limit
const PARSE_DAILY_LIMIT = 25;

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = await rateLimit(clientKey(req, "parse-resume"), PARSE_DAILY_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many uploads from this device today. Try again tomorrow." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "That file is larger than 5 MB. Please upload a smaller resume." },
        { status: 413 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = "";

    if (ext === "txt") {
      text = buffer.toString("utf-8");
    } else if (ext === "pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text: pages } = await extractText(pdf, { mergePages: true });
      text = Array.isArray(pages) ? pages.join("\n") : (pages as string);
    } else if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, or TXT." }, { status: 400 });
    }

    text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!text) return NextResponse.json({ error: "Could not extract text from file." }, { status: 422 });

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[parse-resume]", err);
    return NextResponse.json({ error: "Failed to parse file." }, { status: 500 });
  }
}
