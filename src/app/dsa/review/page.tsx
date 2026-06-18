import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile, isUserPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { ReviewClient } from "@/components/dsa/ReviewClient";
import { Bit } from "@/components/dsa/Mascot";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Daily Practice — DSA Adventure" };
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/dsa/review");

  const pro = isUserPro(profile.plan, profile.email);

  if (!pro) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mb-3 text-5xl">👑</div>
          <Bit mood="think" size="lg" className="mx-auto" />
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Daily Practice is a Pro feature</h1>
          <p className="mt-2 text-slate-500">
            Spaced repetition resurfaces what you learned right before you&apos;d forget it — the secret to remembering
            long-term. Upgrade to unlock it.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/dsa" className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200">
              ← Map
            </Link>
            <Link href="/billing" className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">
              Upgrade to Pro
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: due } = await supabase
    .from("dsa_srs")
    .select("item_id, item_type")
    .eq("user_id", profile.id)
    .lte("due_date", today)
    .order("due_date", { ascending: true });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-1 text-center text-3xl font-extrabold text-slate-900">Daily Practice 🧠</h1>
        <p className="mb-8 text-center text-slate-500">Quick flashcards to keep what you learned fresh.</p>
        <ReviewClient due={due ?? []} />
      </main>
      <Footer />
    </>
  );
}
