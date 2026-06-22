import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { sanitizeJson } from "@/lib/json-utils";
import { FREE_SLIDE_CAP, PRO_SLIDE_CAP, type Deck, type Slide, type SlideLayout } from "@/lib/ppt/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LAYOUTS: SlideLayout[] = ["title", "section", "bullets", "two-column", "quote", "stat", "closing"];

type Mode = "topic" | "document" | "enhance";

function buildPrompt(mode: Mode, content: string, slideCount: number, tone: string) {
  const intent =
    mode === "topic"
      ? `Create a presentation about this topic/idea:\n"""${content}"""`
      : mode === "document"
        ? `Turn the following source material into a clean, well-structured presentation. Summarise and organise it — do not copy verbatim:\n"""${content.slice(0, 12000)}"""`
        : `Improve and restructure this existing presentation's content into a more professional, modern deck. Tighten the wording, fix flow, and add a strong opening and closing:\n"""${content.slice(0, 12000)}"""`;

  return `You are an expert presentation designer. ${intent}

Produce EXACTLY ${slideCount} slides. Tone: ${tone}. Make it professional, modern, and engaging.

Rules:
- Slide 1 must be layout "title" (cover). The final slide must be layout "closing".
- Use a VARIETY of layouts across the deck: "section" dividers, "bullets", "two-column", "quote", "stat".
- Bullets must be punchy (max ~12 words each), 3–5 per bullet slide. No paragraphs.
- "stat" slides: 1–3 striking numbers with short labels.
- Every slide includes concise speaker "notes" (1–3 sentences).

Return ONLY valid JSON (all strings on ONE line, no literal newlines inside strings):
{
  "title": "<deck title>",
  "subtitle": "<one-line subtitle>",
  "slides": [
    {
      "layout": "title|section|bullets|two-column|quote|stat|closing",
      "title": "<slide title>",
      "subtitle": "<optional>",
      "bullets": ["<point>", "..."],
      "columns": [{"heading": "<label>", "points": ["<point>"]}],
      "quote": "<quote text>",
      "author": "<who>",
      "stats": [{"value": "85%", "label": "<short label>"}],
      "notes": "<speaker notes>"
    }
  ]
}
Only include the fields each layout needs. Output ${slideCount} slides.`;
}

function normalizeSlide(raw: unknown): Slide | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const layout = (LAYOUTS.includes(r.layout as SlideLayout) ? r.layout : "bullets") as SlideLayout;
  const title = typeof r.title === "string" ? r.title : "";
  if (!title && layout !== "quote") return null;
  const slide: Slide = { layout, title };
  if (typeof r.subtitle === "string") slide.subtitle = r.subtitle;
  if (Array.isArray(r.bullets)) slide.bullets = r.bullets.filter((b) => typeof b === "string").slice(0, 6);
  if (Array.isArray(r.columns)) {
    slide.columns = (r.columns as unknown[])
      .map((c) => {
        const cc = c as Record<string, unknown>;
        return { heading: String(cc.heading ?? ""), points: Array.isArray(cc.points) ? cc.points.map(String).slice(0, 6) : [] };
      })
      .slice(0, 3);
  }
  if (typeof r.quote === "string") slide.quote = r.quote;
  if (typeof r.author === "string") slide.author = r.author;
  if (Array.isArray(r.stats)) {
    slide.stats = (r.stats as unknown[])
      .map((s) => {
        const ss = s as Record<string, unknown>;
        return { value: String(ss.value ?? ""), label: String(ss.label ?? "") };
      })
      .slice(0, 3);
  }
  if (typeof r.notes === "string") slide.notes = r.notes;
  return slide;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const profile = await getCurrentProfile();
  const pro = isUserPro(profile?.plan, profile?.email);
  const cap = pro ? PRO_SLIDE_CAP : FREE_SLIDE_CAP;

  const body = await request.json().catch(() => ({}));
  const mode: Mode = ["topic", "document", "enhance"].includes(body.mode) ? body.mode : "topic";
  const content = String(body.content ?? "").trim();
  const tone = String(body.tone ?? "professional").slice(0, 40);
  const theme = body.theme ?? "violet";
  let slideCount = Math.round(Number(body.slideCount) || 8);
  slideCount = Math.max(3, Math.min(cap, slideCount));

  if (!content) return NextResponse.json({ error: "Give me something to work with — a topic, document text, or deck." }, { status: 400 });

  const prompt = buildPrompt(mode, content, slideCount, tone);

  async function call(retrying = false): Promise<Response> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.75,
        max_tokens: 6000,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(55000),
    });
    if (res.status === 429 && !retrying) {
      await new Promise((r) => setTimeout(r, 2500));
      return call(true);
    }
    return res;
  }

  try {
    const res = await call();
    if (res.status === 429) return NextResponse.json({ error: "Lots of decks being built right now — try again in a few seconds." }, { status: 503 });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const d = await res.json();
    const text: string = d.choices?.[0]?.message?.content ?? "{}";
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(sanitizeJson(match[0])) : {};

    const slides = Array.isArray(parsed.slides)
      ? parsed.slides.map(normalizeSlide).filter((s: Slide | null): s is Slide => s !== null)
      : [];
    if (slides.length === 0) throw new Error("No slides produced");

    // Guarantee a closing slide.
    if (slides[slides.length - 1].layout !== "closing") {
      slides[slides.length - 1] = { ...slides[slides.length - 1], layout: "closing" };
    }

    const deck: Deck = {
      title: typeof parsed.title === "string" ? parsed.title : content.slice(0, 60),
      subtitle: typeof parsed.subtitle === "string" ? parsed.subtitle : undefined,
      theme,
      slides,
    };

    return NextResponse.json({ deck });
  } catch (err) {
    console.error("[ppt/generate]", err);
    return NextResponse.json({ error: "Couldn't build the deck. Try rephrasing or fewer slides." }, { status: 502 });
  }
}
