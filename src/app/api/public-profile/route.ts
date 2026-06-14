import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { username, public_bio, is_public, linkedin_url, github_url, portfolio_url, completed_certs } = body;

  // Validate username: lowercase letters, numbers, hyphens only, 3-30 chars
  if (username !== undefined) {
    if (!/^[a-z0-9-]{3,30}$/.test(username)) {
      return NextResponse.json({ error: "Username must be 3-30 chars, lowercase letters/numbers/hyphens only." }, { status: 400 });
    }
    // Check uniqueness (excluding self)
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .single();
    if (existing) return NextResponse.json({ error: "Username already taken." }, { status: 409 });
  }

  const updates: Record<string, unknown> = {};
  if (username !== undefined) updates.username = username;
  if (public_bio !== undefined) updates.public_bio = public_bio;
  if (is_public !== undefined) updates.is_public = is_public;
  if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url;
  if (github_url !== undefined) updates.github_url = github_url;
  if (portfolio_url !== undefined) updates.portfolio_url = portfolio_url;
  if (completed_certs !== undefined) updates.completed_certs = completed_certs;

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
