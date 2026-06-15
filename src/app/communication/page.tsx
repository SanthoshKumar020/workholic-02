import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { CommunicationClient } from "@/components/CommunicationClient";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

export const metadata = { title: "Communication Coach — HYRISE" };

export default async function CommunicationPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/communication");

  if (profile.plan !== "pro") {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <div className="max-w-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
              <Lock className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Communication Coach</h1>
            <p className="mt-3 text-slate-500">
              Get AI feedback on your workplace communication — emails, messages, presentations. Pro feature.
            </p>
            <Link href="/billing" className="mt-6 inline-flex items-center rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-white shadow-md hover:opacity-90">
              Upgrade to Pro
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Communication Coach</h1>
          <p className="mt-2 text-slate-500">
            Analyze and improve your professional communication — emails, slack messages, presentations.
          </p>
        </div>
        <CommunicationClient />
      </main>
      <Footer />
    </>
  );
}
