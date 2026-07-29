import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

/**
 * Fetch REAL job listings from Remotive.
 *
 * ── Why this replaced the previous implementation ───────────────────────────
 * This function used to ask Groq to "Generate 8 realistic job listings" and
 * email the result to users as their daily job alert. Those roles did not
 * exist. The companies were real, the openings were invented, and the "Apply
 * now" button pointed at a careers-page search that would return nothing.
 *
 * For someone job hunting — who may act on this within minutes, and who is
 * already dealing with rejection — that is the single most damaging thing this
 * product could send. The first time someone realises the listings are
 * fabricated, everything else we tell them (their ATS score, their interview
 * feedback) becomes suspect too.
 *
 * Remotive is the same free source /api/jobs already uses. If it is
 * unavailable we send NOTHING rather than falling back to generated content.
 */
interface RemotiveJob {
  title: string;
  company_name: string;
  candidate_required_location?: string;
  job_type?: string;
  url: string;
  salary?: string;
  publication_date?: string;
  description?: string;
}

/** Strip HTML and clamp Remotive's description down to a short summary. */
function summarise(html: string | undefined, max = 160): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function relativeDate(iso: string | undefined): string {
  if (!iso) return "Recently posted";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "Recently posted";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

async function fetchRealJobs(role: string, keywords: string, limit = 8): Promise<JobListing[]> {
  const url = new URL("https://remotive.com/api/remote-jobs");
  const search = (keywords || role).trim();
  if (search) url.searchParams.set("search", search);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Remotive ${res.status}`);

  const data = (await res.json()) as { jobs?: RemotiveJob[] };

  return (data.jobs ?? []).slice(0, limit).map((j) => ({
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location || "Remote",
    workMode: "Remote",
    salary: j.salary || "",
    description: summarise(j.description),
    postedAt: relativeDate(j.publication_date),
    // Link straight to the real posting. `careerLink` was only needed when the
    // listings were invented and had no genuine URL to point at.
    applyUrl: j.url,
    applySite: "Remotive",
  }));
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

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email not configured." }, { status: 500 });
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
    try {
      // Resolve the recipient from the PROFILE, not from the alert row.
      // `job_alerts.email` is writable by the user under a row-level-only RLS
      // policy, so a user could point their alert at any address and have us
      // deliver HYRISE-branded mail there daily.
      const { data: owner } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", alert.user_id)
        .single();

      const recipient = owner?.email;
      if (!recipient) continue;

      const jobs = await fetchRealJobs(alert.role ?? "", alert.keywords ?? "");

      // Send nothing rather than something invented. An empty inbox is a much
      // smaller cost than a fabricated listing someone acts on.
      if (jobs.length === 0) continue;

      const html = buildEmailHtml(jobs, alert.role ?? alert.keywords ?? "", appUrl, istHour);

      await resend.emails.send({
        from: "HYRISE Jobs <jobs@hyrise.swache.in>",
        to: recipient,
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
