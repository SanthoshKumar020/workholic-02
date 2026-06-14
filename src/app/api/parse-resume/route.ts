import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

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
