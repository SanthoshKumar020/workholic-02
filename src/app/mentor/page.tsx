import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MentorClient } from "@/components/MentorClient";
import { getCurrentProfile, isPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Career Mentor — ResumeBoost" };

export default async function MentorPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/mentor");

  if (profile.plan !== "pro") {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <div className="max-w-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
              <Lock className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">AI Career Mentor</h1>
            <p className="mt-3 text-slate-500">
              A personal AI mentor that remembers your resume, goals, and progress — and gives you a fresh weekly action plan every Monday.
            </p>
            <Link href="/billing" className="mt-6 inline-flex items-center rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white shadow-md hover:opacity-90">
              Upgrade to Pro
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const supabase = createClient();
  const [{ data: memory }, { data: messages }] = await Promise.all([
    supabase.from("mentor_memory").select("*").eq("user_id", profile.id).single(),
    supabase.from("mentor_messages").select("*").eq("user_id", profile.id).order("created_at", { ascending: true }).limit(40),
  ]);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <MentorClient
          initialMemory={memory ?? null}
          initialMessages={messages ?? []}
          profileName={profile.full_name ?? "there"}
          profileTargetRole={profile.target_role ?? ""}
        />
      </main>
      <Footer />
    </>
  );
}
