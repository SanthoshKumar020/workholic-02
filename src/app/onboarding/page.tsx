import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/plan";
import { OnboardingClient } from "@/components/OnboardingClient";

export const metadata = { title: "Get Started — ResumeBoost" };

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9ff] p-4">
      <OnboardingClient profile={profile} />
    </div>
  );
}
