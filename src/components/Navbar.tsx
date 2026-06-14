import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ThemeToggle";

export async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient shadow-glow-sm transition-shadow group-hover:shadow-glow-md">
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6-4h6M5 8h.01M5 12h.01M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" />
            </svg>
          </div>
          <span className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
            Resume<span className="text-brand-600">Boost</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/#pricing"
            className="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:block dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Pricing
          </Link>

          {user ? (
            <>
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/builder", label: "Builder" },
                { href: "/roadmaps", label: "Roadmaps" },
                { href: "/jobs", label: "Jobs" },
                { href: "/billing", label: "Billing" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:block dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
              <ThemeToggle />
              <form action="/auth/signout" method="post" className="ml-1">
                <button className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="ml-1 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 hover:shadow-glow-sm"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
