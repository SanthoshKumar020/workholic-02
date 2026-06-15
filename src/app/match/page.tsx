import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { MatchClient } from "@/components/MatchClient";
import { redirect } from "next/navigation";

export const metadata = { title: "Job Match Analyzer — HYRISE" };

export default async function MatchPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/match");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Job Match Analyzer</h1>
          <p className="mt-2 text-slate-500">
            Paste your resume and a job description to see how well you match and get ATS improvement tips.
            {!profile || profile.plan !== "pro" ? " Full keyword tips available on Pro." : ""}
          </p>
        </div>
        <MatchClient plan={profile?.plan ?? "free"} />
      </main>
      <Footer />
    </>
  );
}
