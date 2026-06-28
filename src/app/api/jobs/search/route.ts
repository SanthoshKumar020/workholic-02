import { NextResponse } from "next/server";
import { getGroqKey } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin, isPro } from "@/lib/plan";
import { careerLink } from "@/lib/jobs/careerLinks";

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
  matchScore: number;
  careerUrl?: string;
}

export interface JobResult extends JobListing {
  applyUrl: string;   // company's official careers page
  applySite: string;  // button label, e.g. "Amazon Careers"
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
    resumeText?: string;
  };

  const role = (body.role || "").trim();
  const location = (body.location || "").trim();
  const workMode = (body.workMode || "Any").trim();
  const experience = (body.experience || "Any").trim();
  const skills = (body.skills || "").trim();
  const resumeText = (body.resumeText || "").trim().slice(0, 3000); // cap to keep prompt size sane

  if (!role) {
    return NextResponse.json({ error: "Role is required." }, { status: 400 });
  }

  const groqKey = getGroqKey();
  if (!groqKey) {
    return NextResponse.json({ error: "AI job search is not configured." }, { status: 503 });
  }

  const locationStr = location || "India";
  const workModeStr = workMode === "Any" ? "Remote, Hybrid, or On-site" : workMode;
  const expStr = experience === "Any" ? "any experience level" : experience;

  const resumeSection = resumeText
    ? `\nCandidate resume excerpt (use this to compute accurate match scores):\n"""\n${resumeText}\n"""\nScore each job 30–99 based on how well it matches the candidate's actual skills, experience, and background in the resume.`
    : `\nNo resume provided — score each job 70–90 based on the role and skills criteria only.`;

  const skillsSection = skills ? `Key skills: ${skills}.` : "";

  const prompt = `You are a job search engine. Generate exactly 15 realistic job listings matching this search:
- Role: ${role}
- Location: ${locationStr}
- Work Mode: ${workModeStr}
- Experience: ${expStr}
- ${skillsSection}
${resumeSection}

Rules:
- Use real, well-known companies operating in that region
- Salary in local currency (₹ LPA for India, $ for US, £ for UK)
- postedAt: "X days/hours ago"
- requirements: 4–6 specific technical skills required for the job
- matchScore: integer, be realistic — vary scores widely based on fit
- careerUrl: the company's OFFICIAL careers/jobs page URL (e.g. careers.google.com, amazon.jobs, careers.swiggy.com). NEVER use LinkedIn, Naukri, Indeed, Glassdoor or any job aggregator. If unsure of the exact careers URL, omit the field.

Respond with ONLY valid JSON:
{
  "jobs": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "workMode": "Remote|Hybrid|On-site",
      "salary": "string",
      "description": "2–3 sentence job description",
      "requirements": ["string", "string", "string", "string"],
      "postedAt": "string",
      "matchScore": number,
      "careerUrl": "string"
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
        temperature: 0.6,
        max_tokens: 4500,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}`);

    const groqData = await res.json();
    const text: string = groqData.choices?.[0]?.message?.content ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as { jobs: JobListing[] };

    const allJobs: JobResult[] = (parsed.jobs ?? []).map((j) => {
      const link = careerLink(j.company, j.title, j.careerUrl);
      return { ...j, applyUrl: link.url, applySite: link.label };
    });

    // Only show 50%+ match jobs, sorted best first
    const filtered = allJobs
      .filter((j) => j.matchScore >= 50)
      .sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ jobs: filtered, total: allJobs.length });
  } catch (err) {
    console.error("Job search error:", err);
    return NextResponse.json({ error: "Could not fetch jobs right now. Please try again." }, { status: 502 });
  }
}
