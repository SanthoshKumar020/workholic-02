import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Validate cron secret
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Resend not configured." }, { status: 500 });
  }

  const supabase = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Get all enabled job alerts
  const { data: alerts, error } = await supabase
    .from("job_alerts")
    .select("*")
    .eq("enabled", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ message: "No active job alerts.", sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const alert of alerts) {
    if (!alert.email) continue;

    try {
      // Fetch jobs from Remotive for this alert
      const url = new URL("https://remotive.com/api/remote-jobs");
      if (alert.keywords) url.searchParams.set("search", alert.keywords);
      if (alert.role) url.searchParams.set("category", alert.role);
      url.searchParams.set("limit", "10");

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
      const data = res.ok ? await res.json() : { jobs: [] };
      const jobs = (data.jobs || []).slice(0, 8);

      if (jobs.length === 0) continue;

      const listHtml = jobs
        .map(
          (j: { title: string; url: string; company_name: string; candidate_required_location: string }) =>
            `<li style="margin-bottom:8px"><a href="${j.url}" style="color:#4f46e5;font-weight:600">${j.title}</a><br><span style="color:#64748b;font-size:13px">${j.company_name} · ${j.candidate_required_location || "Remote"}</span></li>`
        )
        .join("");

      await resend.emails.send({
        from: "ResumeBoost Jobs <jobs@resumeboost.app>",
        to: alert.email,
        subject: `🔍 ${jobs.length} new remote jobs for you`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#1e293b">Your daily job matches</h2><p style="color:#64748b">Keywords: <strong>${alert.keywords || alert.role || "remote"}</strong></p><ul style="padding-left:20px">${listHtml}</ul><p style="margin-top:24px"><a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">View all jobs</a></p><p style="color:#94a3b8;font-size:12px;margin-top:24px">To unsubscribe, go to your <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs">job alerts settings</a>.</p></div>`,
      });
      sent++;
    } catch (e) {
      errors.push(`Alert ${alert.id}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  return NextResponse.json({ message: `Sent ${sent} alert emails.`, sent, errors });
}
