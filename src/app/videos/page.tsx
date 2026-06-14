import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { VideosClient } from "@/components/VideosClient";
import { redirect } from "next/navigation";

export const metadata = { title: "Learning Videos — ResumeBoost" };

export default async function VideosPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/videos");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Learning Videos</h1>
          <p className="mt-2 text-slate-500">
            Search for top-rated educational videos on any career topic.
          </p>
        </div>
        <VideosClient preferredLanguage={profile.preferred_language || "en"} />
      </main>
      <Footer />
    </>
  );
}
