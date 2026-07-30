import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { createAdminClient } from "@/lib/supabase/admin";
import { InstitutionDashboard } from "@/components/InstitutionDashboard";
import { PageShell } from "@/components/ui/PageShell";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Placement Dashboard — HYRISE",
  robots: { index: false, follow: false },
};

/**
 * Placement-cell dashboard.
 *
 * Admin-only. Membership alone is not enough — a student must never reach
 * batch analytics, so the role check happens here as well as in the API.
 */
export default async function InstitutionPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/institution");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("institution_members")
    .select("institution_id, role")
    .eq("user_id", profile.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!membership) redirect("/dashboard");

  return (
    <>
      <Navbar />
      <PageShell width="wide">
        <InstitutionDashboard />
      </PageShell>
      <Footer />
    </>
  );
}
