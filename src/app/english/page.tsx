import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { EnglishClient } from "@/components/EnglishClient";
import { redirect } from "next/navigation";

export const metadata = { title: "English Learning — HYRISE" };

export default async function EnglishPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/english");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">English for Professionals</h1>
          <p className="mt-2 text-slate-500">
            Learn workplace English through lessons, quizzes, and live conversation practice.
          </p>
        </div>
        <EnglishClient plan={profile.plan} preferredLanguage={profile.preferred_language || "en"} />
      </main>
      <Footer />
    </>
  );
}
