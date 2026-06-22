import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { getDomainTopic, isTopicUnlocked, isTopicAccessible } from "@/lib/domains/catalog";
import { DomainLessonClient } from "@/components/domains/DomainLessonClient";
import { Bit } from "@/components/dsa/Mascot";
import type { DsaMode } from "@/lib/dsa/types";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { domain: string; topic: string } }) {
  const found = getDomainTopic(params.domain, params.topic);
  return { title: found ? `${found.topic.title} — ${found.domain.name}` : "Lesson" };
}

export default async function DomainTopicPage({ params }: { params: { domain: string; topic: string } }) {
  const found = getDomainTopic(params.domain, params.topic);
  if (!found) notFound();
  const { domain, topic, index } = found;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?redirectTo=/domains/${params.domain}/${params.topic}`);

  const supabase = createClient();
  const { data: rows } = await supabase
    .from("domain_progress")
    .select("topic, status")
    .eq("user_id", profile.id)
    .eq("domain", domain.slug);

  const masteredSet = new Set((rows ?? []).filter((r) => r.status === "mastered").map((r) => r.topic));
  const pro = isUserPro(profile.plan, profile.email);
  const unlocked = isTopicUnlocked(index, masteredSet, domain.roadmap);
  const accessible = isTopicAccessible(index, domain, pro);
  const mode: DsaMode = (profile.dsa_mode as DsaMode) ?? "beginner";
  const nextTopic = domain.roadmap[index + 1]?.slug ?? null;

  if (!unlocked || !accessible) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mb-3 text-5xl">{unlocked ? "👑" : "🔒"}</div>
          <Bit mood="think" size="lg" className="mx-auto" />
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            {unlocked ? "This is a Pro topic" : "Finish the previous topic first"}
          </h1>
          <p className="mt-2 text-slate-500">
            {unlocked ? "Upgrade to Pro to unlock the full roadmap." : `Master "${domain.roadmap[index - 1]?.title}" to open this one.`}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href={`/domains/${domain.slug}`} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200">← Roadmap</Link>
            {unlocked && <Link href="/billing" className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">Upgrade to Pro</Link>}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <DomainLessonClient
          domainSlug={domain.slug}
          domainName={domain.name}
          topicSlug={topic.slug}
          topicTitle={topic.title}
          index={index}
          total={domain.roadmap.length}
          nextTopicSlug={nextTopic}
          initialMode={mode}
        />
      </main>
      <Footer />
    </>
  );
}
