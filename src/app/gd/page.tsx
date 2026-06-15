import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { GDPracticeClient } from "@/components/GDPracticeClient";
import { redirect } from "next/navigation";

export const metadata = { title: "GD Practice — HYRISE" };

export default async function GDPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/gd");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Group Discussion Practice</h1>
          <p className="mt-2 text-slate-500">
            AI gives you a topic. You respond (voice or text). It scores your fluency, structure, and content
            — then shows you a model response.
          </p>
        </div>
        <GDPracticeClient />
      </main>
      <Footer />
    </>
  );
}
