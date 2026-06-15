import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUserPro } from "@/lib/plan";
import { sendEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

/** Get the current user's job alert preference (single row). */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("job_alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ alert: data ?? null });
}

/** Create or update the job alert preference (Pro only). */
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
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json({ error: "Job alerts are a Pro feature." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    keywords?: string;
    role?: string;
    frequency?: "daily" | "weekly";
    enabled?: boolean;
  };

  // Upsert the latest preference row for this user.
  const { data: existing } = await supabase
    .from("job_alerts")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    user_id: user.id,
    keywords: body.keywords ?? null,
    role: body.role ?? null,
    frequency: body.frequency === "weekly" ? "weekly" : "daily",
    enabled: !!body.enabled,
  };

  const query = existing
    ? supabase.from("job_alerts").update(payload).eq("id", existing.id).eq("user_id", user.id)
    : supabase.from("job_alerts").insert(payload);

  const { data, error } = await query.select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Confirm the preference change by email (best-effort).
  if (user.email && payload.enabled) {
    await sendEmail({
      to: user.email,
      subject: "Your HYRISE job alerts are on",
      html: `<p>You're set to receive <strong>${payload.frequency}</strong> job alerts${
        payload.role ? ` for <strong>${payload.role}</strong>` : ""
      }. You can change this anytime from the Jobs page.</p>`,
    });
  }

  return NextResponse.json({ alert: data });
}
