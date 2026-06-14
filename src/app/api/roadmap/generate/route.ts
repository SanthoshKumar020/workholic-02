import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGroq } from "@/lib/groq";
import type { RoadmapContent, RoadmapStep } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseRoadmapContent(raw: unknown): Omit<RoadmapContent, "lang" | "langLabel"> {
  if (!raw || typeof raw !== "object") throw new Error("Roadmap response was not a JSON object.");
  const r = raw as Record<string, unknown>;

  const topic = typeof r.topic === "string" ? r.topic.trim() : "";
  const summary = typeof r.summary === "string" ? r.summary.trim() : "";
  const estimatedWeeks =
    typeof r.estimatedWeeks === "number" && r.estimatedWeeks > 0
      ? Math.round(r.estimatedWeeks)
      : 8;

  if (!Array.isArray(r.steps) || r.steps.length === 0)
    throw new Error("Roadmap response contained no steps.");

  const steps: RoadmapStep[] = r.steps.map((s: unknown, i: number) => {
    if (!s || typeof s !== "object") throw new Error(`Step ${i + 1} is not an object.`);
    const step = s as Record<string, unknown>;
    return {
      title: typeof step.title === "string" ? step.title.trim() : `Step ${i + 1}`,
      description: typeof step.description === "string" ? step.description.trim() : "",
      skills: Array.isArray(step.skills)
        ? step.skills.filter((sk): sk is string => typeof sk === "string")
        : [],
      youtubeQuery: typeof step.youtubeQuery === "string" ? step.youtubeQuery : "",
      freeCourseQuery: typeof step.freeCourseQuery === "string" ? step.freeCourseQuery : "",
      paidCourseQuery: typeof step.paidCourseQuery === "string" ? step.paidCourseQuery : "",
      done: false,
    };
  });

  return { topic, summary, estimatedWeeks, steps };
}

// Language code → full name mapping for the AI prompt
const LANG_NAMES: Record<string, string> = {
  en: "English", ta: "Tamil", hi: "Hindi", te: "Telugu", kn: "Kannada",
  ml: "Malayalam", mr: "Marathi", bn: "Bengali", gu: "Gujarati",
  pa: "Punjabi", or: "Odia", ur: "Urdu",
  es: "Spanish", fr: "French", de: "German", ja: "Japanese",
  zh: "Mandarin Chinese", ko: "Korean", ar: "Arabic",
  pt: "Portuguese", it: "Italian", ru: "Russian",
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { topic?: string; lang?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const topic = (body.topic ?? "").trim();
  if (topic.length < 2)
    return NextResponse.json({ error: 'Please enter a topic (e.g. "Python", "Data Analyst").' }, { status: 400 });

  const langCode = body.lang || "en";
  const langName = LANG_NAMES[langCode] || langCode;
  const isEnglish = langCode === "en";

  const langInstruction = isEnglish
    ? ""
    : ` IMPORTANT: All youtubeQuery, freeCourseQuery, and paidCourseQuery values MUST be in ${langName} language (e.g. append "in ${langName}" to every search query). This ensures users find resources in ${langName}.`;

  let content: RoadmapContent;
  try {
    const raw = await callGroq([
      {
        role: "system",
        content: `You are a career learning expert. Create a comprehensive, practical learning roadmap. Return JSON with: topic (string), summary (string, 2-3 sentences), estimatedWeeks (number), steps (array of 6-10 objects each with: title, description, skills (string array), youtubeQuery (specific YouTube search query), freeCourseQuery (search term for free courses), paidCourseQuery (search term for paid courses), done: false).${langInstruction}`,
      },
      {
        role: "user",
        content: `Create a learning roadmap for: ${topic}`,
      },
    ]);
    const parsed = parseRoadmapContent(raw);
    content = { ...parsed, lang: langCode, langLabel: langName };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Roadmap generation failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const { data, error: dbErr } = await supabase
    .from("roadmaps")
    .insert({ user_id: user.id, topic: content.topic || topic, content })
    .select()
    .single();

  await supabase.rpc("increment_xp", { user_id: user.id, amount: 15 }).then(() => null, () => null);

  if (dbErr) {
    return NextResponse.json(
      {
        warning: "Generated your roadmap but could not save it.",
        roadmap: { id: null, user_id: user.id, topic, content, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ roadmap: data });
}
