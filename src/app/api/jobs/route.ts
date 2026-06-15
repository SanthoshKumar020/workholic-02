import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { isUserPro } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location: string;
  job_type: string;
  publication_date: string;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Check Pro plan
  const { data: profile } = await supabase.from("profiles").select("plan, email").eq("id", user.id).single();
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json({ error: "Job search is a Pro feature. Upgrade to access it." }, { status: 403 });
  }

  let body: { keywords?: string; role?: string; limit?: number; email?: string; sendEmail?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const keywords = (body.keywords || "").trim();
  const role = (body.role || "").trim();
  const limit = Math.min(body.limit ?? 20, 50);

  const url = new URL("https://remotive.com/api/remote-jobs");
  if (keywords) url.searchParams.set("search", keywords);
  if (role) url.searchParams.set("category", role);
  url.searchParams.set("limit", String(limit));

  let jobs: Array<{ title: string; company: string; location: string; type: string; url: string }> = [];

  try {
    const res = await fetch(url.toString(), {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const data = await res.json();
      jobs = (data.jobs ?? []).map((j: RemotiveJob) => ({
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || "Remote",
        type: j.job_type || "Full-time",
        url: j.url,
      }));
    }
  } catch {
    // Remotive unavailable — return empty gracefully
  }

  // Optional email delivery
  if (body.sendEmail && jobs.length > 0) {
    const emailTo = body.email || profile?.email;
    if (emailTo && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const listHtml = jobs
          .slice(0, 10)
          .map((j) => `<li><a href="${j.url}">${j.title}</a> @ ${j.company} (${j.location})</li>`)
          .join("");
        await resend.emails.send({
          from: "HYRISE <jobs@HYRISE.app>",
          to: emailTo,
          subject: `🔍 ${jobs.length} remote jobs matching "${keywords || role}"`,
          html: `<h2>Your job matches</h2><ul>${listHtml}</ul><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs">View all on HYRISE</a></p>`,
        });
      } catch {
        // Email failure is non-fatal
      }
    }
  }

  return NextResponse.json({ jobs, count: jobs.length });
}
