import { NextResponse } from "next/server";
import { getGroqKey } from "@/lib/groq";
import { createAdminClient } from "@/lib/supabase/admin";
import { careerLink } from "@/lib/jobs/careerLinks";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface JobListing {
  title: string;
  company: string;
  location: string;
  workMode: string;
  salary: string;
  description: string;
  postedAt: string;
  applyUrl: string;
  applySite: string;
}

/** Current IST hour as "HH:00" string. */
function currentISTHour(): string {
  const utcMs = Date.now();
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(utcMs + istOffsetMs);
  return `${String(istDate.getUTCHours()).padStart(2, "0")}:00`;
}

/** Use Groq to generate 8 jobs for an alert. */
async function fetchJobsViaGroq(role: string, keywords: string, location: string, groqKey: string): Promise<JobListing[]> {
  const prompt = `Generate 8 realistic job listings for this search:
- Role: ${role || keywords || "Software Engineer"}
- Location: ${location || "India"}

Return ONLY valid JSON:
{
  "jobs": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "workMode": "Remote|Hybrid|On-site",
      "salary": "string",
      "description": "1-2 sentence description",
      "postedAt": "X days ago"
    }
  ]
}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON");
  const parsed = JSON.parse(match[0]) as { jobs: Array<{ title: string; company: string; location: string; workMode: string; salary: string; description: string; postedAt: string }> };

  return (parsed.jobs ?? []).map((j) => {
    const link = careerLink(j.company, j.title);
    return { ...j, applyUrl: link.url, applySite: link.label };
  });
}

function buildEmailHtml(
  jobs: JobListing[],
  role: string,
  appUrl: string,
  send_time: string,
): string {
  const listHtml = jobs
    .map(
      (j) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #f1f5f9">
          <p style="margin:0 0 2px 0;font-weight:700;font-size:15px;color:#1e293b">${j.title}</p>
          <p style="margin:0 0 4px 0;font-size:13px;color:#64748b">${j.company} &middot; ${j.location} &middot; <span style="color:#0ea5e9">${j.workMode}</span></p>
          ${j.salary ? `<p style="margin:0 0 4px 0;font-size:12px;color:#22c55e;font-weight:600">${j.salary}</p>` : ""}
          <p style="margin:0 0 8px 0;font-size:13px;color:#475569">${j.description}</p>
          <a href="${j.applyUrl}" style="display:inline-block;background:#4f46e5;color:white;padding:6px 16px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none">Apply now →</a>
          <span style="margin-left:10px;font-size:11px;color:#94a3b8">${j.postedAt}</span>
        </td>
      </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
      <p style="margin:0;font-size:22px;font-weight:800;color:white">HYRISE Jobs</p>
      <p style="margin:6px 0 0 0;font-size:14px;color:#c7d2fe">Your ${send_time} IST daily alert · ${jobs.length} new ${role || "jobs"} found</p>
    </div>
    <div style="padding:24px 32px">
      <table style="width:100%;border-collapse:collapse">
        ${listHtml}
      </table>
      <div style="margin-top:24px;text-align:center">
        <a href="${appUrl}/jobs" style="display:inline-block;background:#4f46e5;color:white;padding:12px 32px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none">
          Search more jobs →
        </a>
      </div>
      <p style="margin-top:24px;font-size:11px;color:#94a3b8;text-align:center">
        You're receiving this because you enabled daily job alerts on HYRISE.<br>
        <a href="${appUrl}/jobs" style="color:#6366f1">Manage alert settings</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const groqKey = getGroqKey();
  if (!process.env.RESEND_API_KEY || !groqKey) {
    return NextResponse.json({ error: "Email or AI not configured." }, { status: 500 });
  }

  const supabase = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hyrise.swache.in";

  // Find the current IST hour slot (e.g. "09:00")
  const istHour = currentISTHour();

  // Fetch enabled alerts whose send_time matches the current IST hour
  const { data: alerts, error } = await supabase
    .from("job_alerts")
    .select("*")
    .eq("enabled", true)
    .eq("send_time", istHour);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ message: `No alerts scheduled for ${istHour} IST.`, sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const alert of alerts) {
    if (!alert.email) continue;
    try {
      const jobs = await fetchJobsViaGroq(
        alert.role ?? "",
        alert.keywords ?? "",
        "", // job_alerts has no location column — Groq defaults to India
        groqKey,
      );
      if (jobs.length === 0) continue;

      const html = buildEmailHtml(jobs, alert.role ?? alert.keywords ?? "", appUrl, istHour);

      await resend.emails.send({
        from: "HYRISE Jobs <jobs@hyrise.swache.in>",
        to: alert.email,
        subject: `🔍 ${jobs.length} ${alert.role || "job"} listings — your ${istHour} IST alert`,
        html,
      });
      sent++;
    } catch (e) {
      errors.push(`Alert ${alert.id}: ${e instanceof Error ? e.message : "Unknown"}`);
    }
  }

  return NextResponse.json({ message: `Sent ${sent} alert emails for ${istHour} IST.`, sent, errors });
}
