import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* ambient brand glow */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Image src="/logo.png" alt="HYRISE" width={180} height={58} className="h-14 w-auto object-contain" priority />
        </Link>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          {/* gradient accent header */}
          <div className="h-1.5 w-full bg-brand-gradient" />
          <div className="p-8">
            <Suspense fallback={<div className="text-center text-sm text-slate-400">Loading…</div>}>
              <AuthForm mode="login" />
            </Suspense>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          By continuing you agree to our{" "}
          <Link href="/terms" className="font-medium text-brand-600 hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-brand-600 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
