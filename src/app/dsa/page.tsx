import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { DSAPracticeClient } from "@/components/DSAPracticeClient";
import { redirect } from "next/navigation";

export const metadata = { title: "DSA Practice — ResumeBoost" };

export default async function DSAPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/dsa");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">DSA Practice</h1>
          <p className="mt-2 text-slate-500">
            Coding problems with AI hints, complexity feedback, and an approach explainer check.
            Pick a topic and difficulty to get started.
          </p>
        </div>
        <DSAPracticeClient />
      </main>
      <Footer />
    </>
  );
}
