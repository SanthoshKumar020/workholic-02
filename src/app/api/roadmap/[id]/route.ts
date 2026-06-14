import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RoadmapContent } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** GET /api/roadmap/[id] — fetch a single roadmap (RLS enforces ownership). */
export async function GET(_request: Request, { params }: Ctx) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data, error } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Roadmap not found." }, { status: 404 });
  }
  return NextResponse.json({ roadmap: data });
}

/**
 * PATCH /api/roadmap/[id]
 * Body: { content: RoadmapContent }
 * Persists the full content blob (with updated step.done flags).
 * Called by the renderer after the user toggles a step checkbox.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { content?: RoadmapContent };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.content || !Array.isArray(body.content.steps)) {
    return NextResponse.json({ error: "content.steps is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("roadmaps")
    .update({ content: body.content })
    .eq("id", params.id)
    .eq("user_id", user.id) // belt-and-suspenders on top of RLS
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not update roadmap." }, { status: 500 });
  }
  return NextResponse.json({ roadmap: data });
}

/** DELETE /api/roadmap/[id] — remove a saved roadmap. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { error } = await supabase
    .from("roadmaps")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
