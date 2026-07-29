"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/**
 * Primary navigation.
 *
 * Breakpoint note: the signed-in bar carries 8 items plus a logo. At the old
 * `md:` (768px) switch those wrapped and overflowed between roughly 768–950px,
 * which is exactly where tablets and small laptops sit. It now switches at
 * `lg:` (1024px) and the logo is smaller on mobile, where 56px of header
 * height was eating the top of every page.
 */
const AUTH_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/builder", label: "Builder" },
  { href: "/tracker", label: "Tracker" },
  { href: "/dsa", label: "Learn DSA" },
  { href: "/domains", label: "Domains" },
  { href: "/roadmaps", label: "Roadmaps" },
  { href: "/jobs", label: "Jobs" },
  { href: "/billing", label: "Billing" },
];

export function NavbarShell({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  // Close the mobile menu on navigation. Without this it stays open over the
  // new page after a client-side transition.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent the page behind the open menu from scrolling.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        {/* Logo */}
        <Link
          href={isLoggedIn ? "/dashboard" : "/"}
          onClick={close}
          className="flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Image
            src="/logo.png"
            alt="HYRISE"
            width={200}
            height={64}
            className="h-9 w-auto object-contain sm:h-11 lg:h-12"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 lg:flex">
          {!isLoggedIn && (
            <Link
              href="/#pricing"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Pricing
            </Link>
          )}

          {isLoggedIn ? (
            <>
              {AUTH_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive(l.href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <form action="/auth/signout" method="post" className="ml-1.5">
                <button className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="ml-1 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Get started free
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — p-2.5 keeps the tap target at ~44px */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex items-center justify-center rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-100 bg-white px-4 pb-6 pt-2 shadow-lg lg:hidden">
          <div className="flex flex-col gap-0.5">
            {!isLoggedIn && (
              <Link
                href="/#pricing"
                onClick={close}
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Pricing
              </Link>
            )}

            {isLoggedIn ? (
              <>
                {AUTH_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={`rounded-xl px-3 py-3 text-sm font-medium transition ${
                      isActive(l.href)
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
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
                <Link
                  href="/login"
                  onClick={close}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={close}
                  className="rounded-xl bg-brand-gradient px-4 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                >
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
