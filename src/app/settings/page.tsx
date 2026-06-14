import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PublicProfileSetupClient } from "@/components/PublicProfileSetupClient";
import { getCurrentProfile } from "@/lib/plan";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — ResumeBoost" };

const ROADMAP_OPTIONS = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Mobile Developer",
  "Product Manager",
  "UI/UX Designer",
  "Cybersecurity Analyst",
  "Aptitude for Competitive Exams",
  "English Communication",
];

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/settings");

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mb-8 text-slate-500">Manage your public profile and shareable career certificates.</p>
        <PublicProfileSetupClient
          initialUsername={profile.username ?? ""}
          initialBio={profile.public_bio ?? ""}
          initialIsPublic={profile.is_public ?? false}
          initialLinkedin={profile.linkedin_url ?? ""}
          initialGithub={profile.github_url ?? ""}
          initialPortfolio={profile.portfolio_url ?? ""}
          initialCerts={(profile.completed_certs as { title: string; completedAt: string }[]) ?? []}
          roadmapOptions={ROADMAP_OPTIONS}
          userId={profile.id}
          profileName={profile.full_name ?? ""}
        />
      </main>
      <Footer />
    </>
  );
}
