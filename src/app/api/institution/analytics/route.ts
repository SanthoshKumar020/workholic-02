import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Batch-level analytics for a placement cell.
 *
 * ── The one rule this endpoint enforces ─────────────────────────────────────
 * AGGREGATES ONLY. A placement officer sees "average 61, 38% below 60, top gap
 * SQL" and never an individual student's score, resume, or name.
 *
 * That isn't only a DPDP-compliance position, though it is that too — students
 * consented to a career tool, not to their college reading their resume
 * feedback. It's also the version a student would still use after reading the
 * privacy policy, and a tool students avoid is worthless to the college that
 * bought it. We sell the batch view, not surveillance.
 *
 * Small cohorts are suppressed for the same reason: with 3 students in a
 * batch, "average score" is effectively individual data.
 */

/** Below this, aggregates identify individuals. */
const MIN_COHORT = 5;

type Bucket = { label: string; count: number };

function distribution(scores: number[]): Bucket[] {
  const buckets: Bucket[] = [
    { label: "0–39", count: 0 },
    { label: "40–59", count: 0 },
    { label: "60–74", count: 0 },
    { label: "75–89", count: 0 },
    { label: "90–100", count: 0 },
  ];
  for (const s of scores) {
    if (s < 40) buckets[0].count++;
    else if (s < 60) buckets[1].count++;
    else if (s < 75) buckets[2].count++;
    else if (s < 90) buckets[3].count++;
    else buckets[4].count++;
  }
  return buckets;
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const batchLabel = searchParams.get("batch");

  const admin = createAdminClient();

  // Caller must be an ADMIN of exactly one institution. Membership alone is
  // not enough — a student must never reach this data.
  const { data: membership } = await admin
    .from("institution_members")
    .select("institution_id, role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not an institution administrator." }, { status: 403 });
  }

  const { data: institution } = await admin
    .from("institutions")
    .select("id, name, seat_limit, expires_at")
    .eq("id", membership.institution_id)
    .single();

  if (!institution) {
    return NextResponse.json({ error: "Institution not found." }, { status: 404 });
  }

  // Cohort = students of this institution (never the admins themselves).
  let memberQuery = admin
    .from("institution_members")
    .select("user_id, batch_label")
    .eq("institution_id", institution.id)
    .eq("role", "student");

  if (batchLabel) memberQuery = memberQuery.eq("batch_label", batchLabel);

  const { data: members } = await memberQuery;
  const studentIds = (members ?? []).map((m) => m.user_id);

  const batches = Array.from(
    new Set((members ?? []).map((m) => m.batch_label).filter((b): b is string => !!b))
  ).sort();

  if (studentIds.length < MIN_COHORT) {
    return NextResponse.json({
      institution: { name: institution.name, seatLimit: institution.seat_limit, expiresAt: institution.expires_at },
      cohortSize: studentIds.length,
      suppressed: true,
      reason: `Analytics appear once ${MIN_COHORT} students have joined. Below that, an average would identify individuals.`,
      batches,
    });
  }

  // ── Resume scores ──────────────────────────────────────────────────────────
  const { data: resumeRows } = await admin
    .from("resumes")
    .select("user_id, ats_score")
    .in("user_id", studentIds)
    .not("ats_score", "is", null);

  // Best score per student, so a student who iterated 5 times doesn't skew it.
  const bestByUser = new Map<string, number>();
  for (const r of resumeRows ?? []) {
    const score = r.ats_score as number;
    const prev = bestByUser.get(r.user_id) ?? 0;
    if (score > prev) bestByUser.set(r.user_id, score);
  }
  const scores = Array.from(bestByUser.values());
  const withResume = bestByUser.size;

  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const atRisk = scores.filter((s) => s < 60).length;
  const readyToApply = scores.filter((s) => s >= 75).length;

  // ── Interview practice ─────────────────────────────────────────────────────
  const { data: sessionRows } = await admin
    .from("interview_sessions")
    .select("user_id")
    .in("user_id", studentIds);

  const practised = new Set((sessionRows ?? []).map((s) => s.user_id)).size;

  // ── Engagement ─────────────────────────────────────────────────────────────
  const { data: usageRows } = await admin
    .from("feature_usage")
    .select("user_id, feature")
    .in("user_id", studentIds);

  const featureCounts = new Map<string, number>();
  for (const u of usageRows ?? []) {
    featureCounts.set(u.feature, (featureCounts.get(u.feature) ?? 0) + 1);
  }
  const topFeatures = Array.from(featureCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([feature, count]) => ({ feature, count }));

  const activeUsers = new Set((usageRows ?? []).map((u) => u.user_id)).size;

  return NextResponse.json({
    institution: {
      name: institution.name,
      seatLimit: institution.seat_limit,
      expiresAt: institution.expires_at,
    },
    batches,
    selectedBatch: batchLabel,
    cohortSize: studentIds.length,
    suppressed: false,
    resumes: {
      withResume,
      withoutResume: studentIds.length - withResume,
      averageScore: avg,
      atRisk, // below 60 — likely filtered out by an ATS
      readyToApply, // 75+
      distribution: distribution(scores),
    },
    interviews: {
      practised,
      notPractised: studentIds.length - practised,
    },
    engagement: {
      activeUsers,
      inactiveUsers: studentIds.length - activeUsers,
      topFeatures,
    },
  });
}
