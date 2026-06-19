import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { WorldMapClient, type IslandProgress } from "@/components/dsa/WorldMapClient";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "DSA Adventure — HYRISE" };
export const dynamic = "force-dynamic";

export default async function DSAMapPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/dsa");

  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: progressRows }, { count: dueCount }] = await Promise.all([
    supabase.from("dsa_progress").select("topic, stars, status").eq("user_id", profile.id),
    supabase
      .from("dsa_srs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .lte("due_date", today),
  ]);

  const progress: Record<string, IslandProgress> = {};
  for (const row of progressRows ?? []) {
    progress[row.topic] = { stars: row.stars ?? 0, status: row.status ?? "available" };
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900">
            DSA <span className="text-gradient">Adventure</span> 🗺️
          </h1>
          <p className="mt-2 text-slate-500">
            Learn data structures &amp; algorithms by exploring islands — from playful stories to interview-ready code.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/dsa/playground" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              🧪 Code Playground
            </Link>
            <Link href="/dsa/review" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              🧠 Daily Practice
            </Link>
            <Link href="/dsa/practice" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              ⚡ Interview practice
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            New here? Tap the first island and switch to <b>Kid</b> mode for the gentlest start.
          </p>
        </div>

        <WorldMapClient
          progress={progress}
          pro={isUserPro(profile.plan, profile.email)}
          dueCount={dueCount ?? 0}
        />
      </main>
      <Footer />
    </>
  );
}
