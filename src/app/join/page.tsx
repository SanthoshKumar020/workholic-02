import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { createAdminClient } from "@/lib/supabase/admin";
import { JoinInstitutionClient } from "@/components/JoinInstitutionClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Join your college — HYRISE",
  description: "Enter the code from your placement cell to unlock HYRISE for your batch.",
};

/**
 * Where a student redeems the code their placement cell gave them.
 *
 * This page was the missing half of the institution feature: the join API
 * existed but nothing called it, so a college could be set up in the database
 * and its students still had no way in.
 *
 * Accepts /join?code=RVCE-2026 so a TPO can share one link rather than asking
 * 600 students to type a code correctly.
 */
export default async function JoinPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const profile = await getCurrentProfile();

  // Preserve the code through login so a student who clicks the TPO's link
  // while logged out doesn't lose it and land on a bare dashboard.
  if (!profile) {
    const target = searchParams.code
      ? `/join?code=${encodeURIComponent(searchParams.code)}`
      : "/join";
    redirect(`/login?redirectTo=${encodeURIComponent(target)}`);
  }

  // Already a member? Show that instead of an empty form.
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("institution_members")
    .select("role, batch_label, institution_id")
    .eq("user_id", profile.id)
    .maybeSingle();

  let existing: { name: string; role: string; batch: string | null } | null = null;
  if (membership) {
    const { data: inst } = await admin
      .from("institutions")
      .select("name")
      .eq("id", membership.institution_id)
      .maybeSingle();
    if (inst) {
      existing = { name: inst.name, role: membership.role, batch: membership.batch_label };
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-14">
        <JoinInstitutionClient initialCode={searchParams.code ?? ""} existing={existing} />
      </main>
      <Footer />
    </>
  );
}
