import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin, isPro } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface JobListing {
  title: string;
  company: string;
  location: string;
  workMode: string;
  salary: string;
  description: string;
  requirements: string[];
  postedAt: string;
  applyUrl: string;
  matchScore: number;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (!isPro(profile?.plan) && !isSuperAdmin(user.email)) {
    return NextResponse.json({ error: "Job search is a Pro feature." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    role?: string;
    location?: string;
    workMode?: string;
    experience?: string;
    skills?: string;
  };

  const role = (body.role || "").trim();
  const location = (body.location || "").trim();
  const workMode = (body.workMode || "Any").trim();
  const experience = (body.experience || "Any").trim();
  const skills = (body.skills || "").trim();

  if (!role) {
    return NextResponse.json({ error: "Role is required." }, { status: 400 });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ error: "AI job search is not configured." }, { status: 503 });
  }

  const locationStr = location || "India";
  const workModeStr = workMode === "Any" ? "Remote, Hybrid, or On-site" : workMode;
  const expStr = experience === "Any" ? "any experience level" : experience;
  const skillsStr = skills ? `Key skills from resume: ${skills}.` : "";

  const prompt = `You are a job search engine. Generate exactly 12 realistic job listings that EXACTLY match this criteria:
- Role: ${role}
- Location: ${locationStr}
- Work Mode: ${workModeStr}
- Experience: ${expStr}
${skillsStr}

Requirements:
- Each job must genuinely match the role and location
- Use real, well-known companies operating in that region
- Salary in appropriate local currency (₹ LPA for India, $ for US/global, £ for UK, etc.)
- applyUrl must be a real LinkedIn jobs search URL: https://www.linkedin.com/jobs/search/?keywords=ENCODED_ROLE&location=ENCODED_LOCATION
- matchScore is 75-99 based on how well the job matches the criteria
- postedAt should be "X days/hours ago" style
- requirements: 4-5 specific technical requirements matching the role

Respond with ONLY valid JSON in this exact format:
{
  "jobs": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "workMode": "Remote|Hybrid|On-site",
      "salary": "string",
      "description": "2-3 sentence job description",
      "requirements": ["string", "string", "string", "string"],
      "postedAt": "string",
      "applyUrl": "string",
      "matchScore": number
    }
  ]
}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      throw new Error(`Groq error ${res.status}`);
    }

    const groqData = await res.json();
    const text = groqData.choices?.[0]?.message?.content ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as { jobs: JobListing[] };
    const jobs = (parsed.jobs ?? []).sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("Job search error:", err);
    return NextResponse.json({ error: "Could not fetch jobs right now. Please try again." }, { status: 502 });
  }
}
