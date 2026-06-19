import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentProfile } from "@/lib/plan";
import { PlaygroundClient } from "@/components/dsa/PlaygroundClient";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Code Playground — DSA Adventure" };

export default async function PlaygroundPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirectTo=/dsa/playground");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/dsa" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Map
        </Link>
        <h1 className="mb-1 text-3xl font-extrabold text-slate-900">Code Playground 🧪</h1>
        <p className="mb-8 text-slate-500">Write and run Python instantly — no setup, right in your browser.</p>
        <PlaygroundClient />
      </main>
      <Footer />
    </>
  );
}
