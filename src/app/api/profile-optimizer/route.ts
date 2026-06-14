import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUserPro } from "@/lib/plan";
import { sanitizeJson } from "@/lib/json-utils";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json({ error: "Profile optimizer is a Pro feature." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    platform?: string;
    resumeText?: string;
    targetRole?: string;
  };

  const platform = body.platform === "naukri" ? "naukri" : "linkedin";
  const targetRole = (body.targetRole || "").trim();
  const resumeText = (body.resumeText || "").trim();

  if (!resumeText) {
    return NextResponse.json({ error: "Please upload your resume first." }, { status: 400 });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: "AI not configured." }, { status: 503 });

  const linkedinPrompt = `You are an expert LinkedIn profile writer. A user has uploaded their resume and wants you to generate the exact copy-paste content for every section of their LinkedIn profile.

Resume content:
---
${resumeText.slice(0, 4000)}
---
${targetRole ? `Target role: ${targetRole}` : ""}

Generate complete, ready-to-paste LinkedIn profile content. Return ONLY valid JSON in this exact format:

{
  "headline": {
    "primary": "<best headline under 220 chars — role + top 2 skills + value prop>",
    "alternatives": ["<variation 2>", "<variation 3>"]
  },
  "about": "<full About/Summary section, 200-300 words, starts with a strong hook, includes what they do, key skills, achievements, and a call to action. Use line breaks for readability>",
  "openToWork": {
    "jobTitles": ["<job title 1>", "<job title 2>", "<job title 3>"],
    "jobTypes": ["Full-time", "Contract"],
    "locationType": "<Remote / On-site / Hybrid — pick most suitable>"
  },
  "experiences": [
    {
      "title": "<job title from resume>",
      "company": "<company from resume>",
      "description": "<3-5 achievement-oriented bullet points using action verbs + metrics. Format each bullet starting with •>"
    }
  ],
  "skills": ["<skill 1>", "<skill 2>", "<up to 20 skills extracted from resume, ranked by relevance to target role>"],
  "headline_tips": "<1 sentence on why this headline was chosen>",
  "about_tips": "<1 sentence on the strategy used for the About section>"
}`;

  const naukriPrompt = `You are an expert Naukri profile writer. A user has uploaded their resume and wants you to generate the exact copy-paste content for every section of their Naukri profile.

Resume content:
---
${resumeText.slice(0, 4000)}
---
${targetRole ? `Target role: ${targetRole}` : ""}

Generate complete, ready-to-paste Naukri profile content. Return ONLY valid JSON in this exact format:

{
  "resumeHeadline": "<under 250 chars — current role + years of experience + top skills. This is what recruiters see first in search results>",
  "profileSummary": "<150-200 word summary. Start with years of experience and domain. Cover key skills, tools, notable achievements, and what kind of role you are seeking. Professional tone.>",
  "keySkills": ["<skill 1>", "<skill 2>", "<up to 15 skills — prioritize those most searched on Naukri for this role>"],
  "experiences": [
    {
      "title": "<job title from resume>",
      "company": "<company from resume>",
      "description": "<3-4 bullet points starting with action verbs, include tools used and measurable impact. Format each bullet starting with •>"
    }
  ],
  "itSkills": [
    {
      "skill": "<tool/technology name>",
      "version": "<version if applicable or leave empty>",
      "lastUsed": "<year e.g. 2024>"
    }
  ],
  "careerObjective": "<2-3 sentence career objective aligned to target role — used in the 'Career Profile' section>",
  "headline_tips": "<1 sentence on why this headline was chosen>",
  "summary_tips": "<1 sentence on the strategy for the profile summary>"
}`;

  const prompt = platform === "linkedin" ? linkedinPrompt : naukriPrompt;

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
        temperature: 0.65,
        max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(50000),
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}`);

    const groqData = await res.json();
    const text = groqData.choices?.[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const result = JSON.parse(sanitizeJson(jsonMatch[0]));
    return NextResponse.json({ result, platform });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not generate profile content. Please try again." }, { status: 502 });
  }
}
