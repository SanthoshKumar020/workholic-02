import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { BLOG_POSTS } from "@/lib/blog/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Weekly HYRISE newsletter — runs on Vercel Cron (see vercel.json).
 *
 * What it does (all legitimate, opt-in):
 *  - Reads subscribers from `email_subscribers` (people who used the homepage
 *    email capture — they explicitly opted in).
 *  - Sends the latest blog post + the explainer video + a soft share nudge.
 *  - Respects a `last_sent` column so nobody is emailed twice in a week.
 *
 * Auth: must be called with `Authorization: Bearer <CRON_SECRET>`.
 * Cost: FREE on Resend's free tier (3k emails/mo) + Supabase free tier.
 *
 * NEVER: scrapes emails, buys lists, or sends to non-opt-in addresses.
 */

interface Subscriber {
  email: string;
  last_sent?: string | null;
}

function buildNewsletterHtml(post: (typeof BLOG_POSTS)[number], appUrl: string) {
  const videoUrl = `${appUrl}/marketing/hyrise-explainer.mp4`;
  return `
  <!DOCTYPE html>
  <html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px">
    <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
        <p style="margin:0;font-size:22px;font-weight:800;color:white">HYRISE</p>
        <p style="margin:6px 0 0 0;font-size:14px;color:#c7d2fe">Your weekly career boost</p>
      </div>
      <div style="padding:24px 32px">
        <p style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:#1e293b">📚 This week's read</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#4f46e5">${post.title}</p>
        <p style="margin:8px 0 16px 0;font-size:14px;color:#475569">${post.description}</p>
        <a href="${appUrl}/blog/${post.slug}" style="display:inline-block;background:#4f46e5;color:white;padding:10px 24px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none">Read the guide →</a>

        <p style="margin:28px 0 8px 0;font-size:15px;font-weight:700;color:#1e293b">🎥 Watch: 30-second HYRISE explainer</p>
        <a href="${videoUrl}" style="color:#6366f1;font-size:14px">▶ Play the video</a>

        <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:12px">
          <p style="margin:0;font-size:13px;color:#475569"><strong>Know someone job-hunting?</strong> Forward this email — sharing HYRISE helps more people land interviews. 💜</p>
        </div>

        <p style="margin-top:24px;font-size:11px;color:#94a3b8;text-align:center">
          You're receiving this because you subscribed to HYRISE career tips.<br>
          <a href="${appUrl}/unsubscribe?email={{EMAIL}}" style="color:#6366f1">Unsubscribe</a>
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
    return NextResponse.json({ error: "RESEND_API_KEY not configured." }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hyrise.swache.in";
  const supabase = createAdminClient();

  // Latest blog post (by date desc)
  const latest = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) return NextResponse.json({ error: "No blog posts." }, { status: 500 });

  // Opt-in subscribers not emailed in the last 6 days
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const { data: subs, error } = await supabase
    .from("email_subscribers")
    .select("email, last_sent")
    .or(`last_sent.is.null,last_sent.lt.${sixDaysAgo}`)
    .limit(2500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) {
    return NextResponse.json({ message: "No subscribers due this week.", sent: 0 });
  }

  const html = buildNewsletterHtml(latest, appUrl);
  let sent = 0;
  const failures: string[] = [];

  for (const s of subs as Subscriber[]) {
    try {
      const personalized = html.replace("{{EMAIL}}", encodeURIComponent(s.email));
      await sendEmail({
        to: s.email,
        subject: `📈 ${latest.title} — your HYRISE weekly`,
        html: personalized,
      });
      // mark sent
      await supabase.from("email_subscribers").update({ last_sent: new Date().toISOString() }).eq("email", s.email);
      sent++;
    } catch {
      failures.push(s.email);
    }
  }

  return NextResponse.json({ message: `Newsletter sent.`, sent, failures: failures.length });
}
