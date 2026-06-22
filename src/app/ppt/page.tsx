import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { PptBuilderClient } from "@/components/ppt/PptBuilderClient";
import { redirect } from "next/navigation";

export const metadata = { title: "AI Presentation Builder — HYRISE" };
export const dynamic = "force-dynamic";

export default async function PptPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/ppt");

  const supabase = createClient();
  const { data: rows } = await supabase
    .from("presentations")
    .select("id, title, deck, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            AI <span className="text-gradient">Presentation</span> Builder 🎞️
          </h1>
          <p className="mt-2 text-slate-500">
            Turn an idea, a document, or an old deck into a professional, modern, animated presentation —
            preview it, then download a real <b>.pptx</b> or PDF.
          </p>
        </div>
        <PptBuilderClient pro={isUserPro(profile.plan, profile.email)} initialDecks={(rows ?? []) as never} />
      </main>
      <Footer />
    </>
  );
}
