import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { getIsland, isIslandUnlocked } from "@/lib/dsa/curriculum";
import { getTopicModule } from "@/components/dsa/topics/registry";
import { IslandClient } from "@/components/dsa/IslandClient";
import { Bit } from "@/components/dsa/Mascot";
import type { DsaMode } from "@/lib/dsa/types";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { topic: string } }) {
  const island = getIsland(params.topic);
  return { title: island ? `${island.kidName} — DSA Adventure` : "DSA Adventure" };
}

export default async function IslandPage({ params }: { params: { topic: string } }) {
  const island = getIsland(params.topic);
  if (!island) notFound();

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?redirectTo=/dsa/${params.topic}`);

  const supabase = createClient();
  const { data: rows } = await supabase
    .from("dsa_progress")
    .select("topic, stars, status")
    .eq("user_id", profile.id);

  const masteredSet = new Set((rows ?? []).filter((r) => r.status === "mastered").map((r) => r.topic));
  const thisStars = rows?.find((r) => r.topic === island.slug)?.stars ?? 0;

  const unlocked = isIslandUnlocked(island, masteredSet);
  const accessible = island.free || isUserPro(profile.plan, profile.email);
  const mode: DsaMode = (profile.dsa_mode as DsaMode) ?? "beginner";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {!unlocked ? (
          <Gate
            emoji="🔒"
            title="This island is still locked"
            body={`Finish ${island.prereqs.map((s) => getIsland(s)?.kidName ?? s).join(" & ")} first, then come back and explore ${island.kidName}!`}
          />
        ) : !accessible ? (
          <Gate
            emoji="👑"
            title={`${island.kidName} is a Pro island`}
            body="Upgrade to Pro to explore every island, get unlimited hints from Bit, and unlock Daily Practice."
            cta={{ href: "/billing", label: "Upgrade to Pro" }}
          />
        ) : !getTopicModule(island.slug) ? (
          <Gate
            emoji="🛠️"
            title={`${island.kidName} is coming soon`}
            body="Bit is still building this island. Check back shortly — the adventure continues!"
          />
        ) : (
          <IslandClient island={island} initialMode={mode} initialStars={thisStars} />
        )}
      </main>
      <Footer />
    </>
  );
}

function Gate({
  emoji,
  title,
  body,
  cta,
}: {
  emoji: string;
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mb-4 text-5xl">{emoji}</div>
      <Bit mood="think" size="lg" className="mx-auto" />
      <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/dsa" className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200">
          ← Back to the map
        </Link>
        {cta && (
          <Link href={cta.href} className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}
