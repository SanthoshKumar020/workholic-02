import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe from re-engagement nudges and the ATS report sequence.
 *
 * No login required, deliberately: forcing someone to sign in before they can
 * stop receiving email is a dark pattern, and it converts an unsubscribe into
 * a spam complaint — which damages the sending domain far more than the lost
 * contact is worth.
 *
 * Two audiences, two identifiers:
 *   ?u=<user id>   — an account holder opting out of nudges
 *   ?email=<addr>  — an ATS lead who never made an account (§5.4)
 *
 * Neither is a secret worth protecting. The worst a guessed value can do is
 * stop somebody's marketing email, which is a harmless failure mode: it grants
 * no read access and changes nothing else. Requiring a signed token here would
 * mean some people cannot unsubscribe at all, which is the far worse outcome.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("u");
  const email = searchParams.get("email")?.toLowerCase().trim();

  const page = (title: string, body: string) =>
    new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:64px;color:#0f172a">
         <h2 style="margin-bottom:8px">${title}</h2>
         <p style="color:#64748b">${body}</p>
         <p style="margin-top:28px"><a href="/" style="color:#4f46e5;font-weight:600">Back to HYRISE</a></p>
       </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );

  const done = page(
    "Unsubscribed",
    "You won't get reminder emails from us again. Your account and data are untouched."
  );
  const failed = page(
    "Something went wrong",
    "Please email admin@swache.in and we'll remove you manually."
  );

  const supabase = createAdminClient();

  if (email && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    const { error } = await supabase
      .from("ats_leads")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("email", email);
    // Also honour it for the newsletter list — someone clicking unsubscribe
    // means "stop emailing me", not "stop this particular sequence".
    await supabase.from("email_subscribers").delete().eq("email", email);
    return error ? failed : done;
  }

  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return page("Invalid link", "That unsubscribe link doesn't look right.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nudge_opt_out: true })
    .eq("id", userId);

  return error ? failed : done;
}
