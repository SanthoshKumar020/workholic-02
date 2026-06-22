import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { getDomain } from "@/lib/domains/catalog";
import { DomainRoadmapClient } from "@/components/domains/DomainRoadmapClient";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { domain: string } }) {
  const d = getDomain(params.domain);
  return { title: d ? `${d.name} Roadmap — HYRISE` : "Domain" };
}

export default async function DomainPage({ params }: { params: { domain: string } }) {
  const domain = getDomain(params.domain);
  if (!domain) notFound();

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?redirectTo=/domains/${params.domain}`);

  const supabase = createClient();
  const { data: rows } = await supabase
    .from("domain_progress")
    .select("topic, stars, status")
    .eq("user_id", profile.id)
    .eq("domain", domain.slug);

  const mastered = (rows ?? []).filter((r) => r.status === "mastered").map((r) => r.topic);
  const stars: Record<string, number> = {};
  for (const r of rows ?? []) stars[r.topic] = r.stars ?? 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/domains" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> All domains
        </Link>
        <div className="mb-8 flex items-center gap-4">
          <div className={cn("flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br text-4xl shadow", domain.gradient)}>
            {domain.emoji}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">{domain.name}</h1>
            <p className="text-slate-500">{domain.blurb}</p>
          </div>
        </div>
        <DomainRoadmapClient
          domain={domain}
          mastered={mastered}
          stars={stars}
          pro={isUserPro(profile.plan, profile.email)}
        />
      </main>
      <Footer />
    </>
  );
}
