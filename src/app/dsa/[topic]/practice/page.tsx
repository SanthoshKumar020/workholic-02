import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { getIsland } from "@/lib/dsa/curriculum";
import { PracticeClient } from "@/components/dsa/PracticeClient";
import { Bit } from "@/components/dsa/Mascot";
import type { DsaMode } from "@/lib/dsa/types";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { topic: string } }) {
  const island = getIsland(params.topic);
  return { title: island ? `${island.kidName} Practice — DSA Adventure` : "Practice" };
}

export default async function PracticePage({ params }: { params: { topic: string } }) {
  const island = getIsland(params.topic);
  if (!island) notFound();

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?redirectTo=/dsa/${params.topic}/practice`);

  const accessible = island.free || isUserPro(profile.plan, profile.email);
  const mode: DsaMode = (profile.dsa_mode as DsaMode) ?? "beginner";

  if (!accessible) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mb-3 text-5xl">👑</div>
          <Bit mood="think" size="lg" className="mx-auto" />
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Practice is a Pro feature here</h1>
          <p className="mt-2 text-slate-500">Upgrade to Pro to unlock guided problem-solving and unlimited AI challenges for every island.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/dsa" className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200">← Map</Link>
            <Link href="/billing" className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">Upgrade to Pro</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const supabase = createClient();
  const { data: attempts } = await supabase
    .from("dsa_attempts")
    .select("problem_id")
    .eq("user_id", profile.id)
    .eq("passed", true)
    .like("problem_id", `${island.slug}:%`);

  const solvedIds = Array.from(new Set((attempts ?? []).map((a) => a.problem_id)));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <PracticeClient island={island} mode={mode} initialSolvedIds={solvedIds} />
      </main>
      <Footer />
    </>
  );
}
