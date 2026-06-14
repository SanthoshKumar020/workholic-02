import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ApplicationTrackerClient } from "@/components/ApplicationTrackerClient";
import { getCurrentProfile } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Application Tracker — ResumeBoost" };

export default async function TrackerPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/tracker");

  const supabase = createClient();
  const { data } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Application Tracker</h1>
          <p className="mt-1 text-slate-500">
            Track every application from submitted to offer. Get AI-drafted follow-up emails in one click.
          </p>
        </div>
        <ApplicationTrackerClient initialApplications={data ?? []} />
      </main>
      <Footer />
    </>
  );
}
