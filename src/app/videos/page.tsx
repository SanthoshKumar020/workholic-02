import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { VideosClient } from "@/components/VideosClient";
import { PageShell } from "@/components/ui/PageShell";
import { redirect } from "next/navigation";

export const metadata = { title: "Learning Videos — HYRISE" };

export default async function VideosPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/videos");

  return (
    <>
      <Navbar />
      <PageShell
        width="wide"
        title="Learning Videos"
        description="Search for top-rated educational videos on any career topic."
      >
        <VideosClient preferredLanguage={profile.preferred_language || "en"} />
      </PageShell>
      <Footer />
    </>
  );
}
