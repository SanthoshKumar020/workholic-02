import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { templatesForPlan, isUserPro } from "@/lib/plan";

export const dynamic = "force-dynamic";

/** List the current user's resumes. */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resumes: data });
}

/** Delete a resume owned by the current user. */
export async function DELETE(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Deleting a generated resume is a Pro-only action — free-plan resumes are permanent.
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  if (!isUserPro(profile?.plan, user.email)) {
    return NextResponse.json(
      { error: "Deleting resumes is a Pro feature." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

/** Update a resume's chosen template (gated by plan). */
export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    template_id?: string;
  };
  if (!body.id || !body.template_id) {
    return NextResponse.json({ error: "id and template_id are required." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const allowed = templatesForPlan(profile?.plan);
  if (!allowed.includes(body.template_id)) {
    return NextResponse.json(
      { error: "That template is available on the Pro plan. Upgrade to unlock it." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("resumes")
    .update({ template_id: body.template_id })
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resume: data });
}
