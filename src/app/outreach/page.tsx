import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { OutreachClient } from "@/components/OutreachClient";
import { redirect } from "next/navigation";

export const metadata = { title: "Outreach Generator — HYRISE" };

export default async function OutreachPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/outreach");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Outreach Generator</h1>
          <p className="mt-2 text-slate-500">
            LinkedIn DMs, cold emails, and referral asks — crafted for your target company and role.
            Networking is the highest-leverage job tactic.
          </p>
        </div>
        <OutreachClient
          defaultName=""
          defaultRole={profile.target_role ?? ""}
        />
      </main>
      <Footer />
    </>
  );
}
