import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Weekly HYRISE marketing / SEO report.
 *
 * Triggered by Vercel Cron (see vercel.json / cron config) or manually:
 *   GET /api/cron/marketing-report  (Authorization: Bearer <CRON_SECRET>)
 *
 * It checks live sitemap URL health and emails a plain-English summary to the
 * owner. It only *reports* — it creates no fake users, no spam, no reviews.
 * The accompanying scripts (scripts/content-calendar.mjs) draft the posting
 * plan that this report references.
 */

async function checkSitemapHealth(base: string) {
  const res = await fetch(`${base}/sitemap.xml`);
  if (!res.ok) return { ok: false, total: 0, broken: [], indexedNote: "" };
  const xml = await res.text();
  const urls: string[] = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);

  let ok = 0;
  const broken: string[] = [];
  // Sample up to 40 URLs (cheap health check; full scan via scripts/seo-monitor.mjs)
  const sample = urls.slice(0, 40);
  await Promise.all(
    sample.map(async (u) => {
      try {
        const r = await fetch(u, { method: "GET", redirect: "manual" });
        if (r.status >= 200 && r.status < 400) ok++;
        else broken.push(`${r.status} ${u}`);
      } catch {
        broken.push(`ERR ${u}`);
      }
    })
  );
  return { ok: true, total: urls.length, sampled: sample.length, broken };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hyrise.swache.in";
  const ownerEmail = process.env.MARKETING_REPORT_EMAIL;

  const health = await checkSitemapHealth(appUrl);

  const html = `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <h2 style="color:#4f46e5">HYRISE · Weekly Growth Report</h2>
    <p style="color:#475569">${new Date().toLocaleDateString("en-IN")}</p>
    <ul style="color:#334155;line-height:1.8">
      <li>🗺️ Sitemap: <b>${health.total}</b> URLs (sampled ${health.sampled ?? health.total})</li>
      <li>✅ Healthy: <b>${health.ok ? `${health.ok}/${health.sampled ?? health.total}` : "n/a"}</b></li>
      <li>❌ Broken: <b>${health.broken.length}</b>${health.broken.length ? `<br><small>${health.broken.slice(0, 5).join("<br>")}</small>` : ""}</li>
    </ul>
    <p style="color:#475569;margin-top:16px">📅 Next: run <code>node scripts/content-calendar.mjs</code> to draft this week's posts, and post the explainer video to LinkedIn / IG Reels / YouTube Shorts.</p>
    <p style="color:#94a3b8;font-size:11px">Automated report — review before acting. No accounts or reviews were created automatically.</p>
  </div>`;

  if (ownerEmail) {
    const r = await sendEmail({
      to: ownerEmail,
      subject: `📈 HYRISE weekly growth report — ${health.total} URLs, ${health.broken.length} broken`,
      html,
    });
    return NextResponse.json({ sent: !r.skipped, health });
  }

  // No owner email configured — just return the report inline.
  return NextResponse.json({ note: "Set MARKETING_REPORT_EMAIL to receive by email.", health });
}
