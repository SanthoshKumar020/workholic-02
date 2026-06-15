"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const AUTH_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/builder", label: "Builder" },
  { href: "/roadmaps", label: "Roadmaps" },
  { href: "/jobs", label: "Jobs" },
  { href: "/billing", label: "Billing" },
];

export function NavbarShell({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">

        {/* Logo */}
        <Link href="/dashboard" onClick={close} className="flex items-center shrink-0">
          <Image
            src="/logo.png"
            alt="HYRISE"
            width={200}
            height={64}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {!isLoggedIn && (
            <Link href="/#pricing" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              Pricing
            </Link>
          )}

          {isLoggedIn ? (
            <>
              {AUTH_LINKS.map((l) => (
                <Link key={l.href} href={l.href}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                  {l.label}
                </Link>
              ))}
              <form action="/auth/signout" method="post" className="ml-1">
                <button className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                Log in
              </Link>
              <Link href="/signup"
                className="ml-1 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
                Get started free
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="flex md:hidden items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-5 pt-2 shadow-lg">
          <div className="flex flex-col gap-0.5">
            {!isLoggedIn && (
              <Link href="/#pricing" onClick={close}
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Pricing
              </Link>
            )}

            {isLoggedIn ? (
              <>
                {AUTH_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} onClick={close}
                    className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    {l.label}
                  </Link>
                ))}
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <form action="/auth/signout" method="post">
                    <button className="w-full rounded-xl border border-slate-200 px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                      Sign out
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/login" onClick={close}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Log in
                </Link>
                <Link href="/signup" onClick={close}
                  className="rounded-xl bg-brand-gradient px-4 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90">
                  Get started free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
