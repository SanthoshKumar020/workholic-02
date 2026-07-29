import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe from re-engagement nudges.
 *
 * No login required, deliberately: forcing someone to sign in before they can
 * stop receiving email is a dark pattern, and it converts an unsubscribe into
 * a spam complaint — which damages the sending domain far more than the lost
 * contact is worth.
 *
 * The user id in the link is not a secret worth protecting here. The worst a
 * guessed id can do is stop somebody's marketing email, which is a harmless
 * failure mode. It grants no read access and changes nothing else.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("u");

  const page = (title: string, body: string) =>
    new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:64px;color:#0f172a">
         <h2 style="margin-bottom:8px">${title}</h2>
         <p style="color:#64748b">${body}</p>
         <p style="margin-top:28px"><a href="/" style="color:#4f46e5;font-weight:600">Back to HYRISE</a></p>
       </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );

  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return page("Invalid link", "That unsubscribe link doesn't look right.");
  }

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ nudge_opt_out: true })
    .eq("id", userId);

  if (error) {
    return page("Something went wrong", "Please email admin@swache.in and we'll remove you manually.");
  }

  return page(
    "Unsubscribed",
    "You won't get reminder emails from us again. Your account and data are untouched."
  );
}
