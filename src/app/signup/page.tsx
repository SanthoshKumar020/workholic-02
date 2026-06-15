import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Image src="/logo.png" alt="HYRISE" width={180} height={58} className="h-14 w-auto object-contain" priority />
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Suspense fallback={<div className="text-center text-sm text-slate-400">Loading…</div>}>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
