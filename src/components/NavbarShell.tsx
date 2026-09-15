"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { TranslationKey } from "@/lib/i18n/translations";

/**
 * Primary navigation.
 *
 * Breakpoint note: the signed-in bar carries 8 items plus a logo. At the old
 * `md:` (768px) switch those wrapped and overflowed between roughly 768–950px,
 * which is exactly where tablets and small laptops sit. It now switches at
 * `lg:` (1024px) and the logo is smaller on mobile, where 56px of header
 * height was eating the top of every page. The language switcher added here
 * is deliberately compact (two short labels, no icon) so it doesn't reopen
 * that overflow problem — it sits in the same row on desktop and drops into
 * the mobile sheet below the links, not squeezed between them.
 */
const AUTH_LINKS: { href: string; key: TranslationKey }[] = [
  { href: "/dashboard", key: "nav_dashboard" },
  { href: "/builder", key: "nav_builder" },
  { href: "/tracker", key: "nav_tracker" },
  { href: "/dsa", key: "nav_dsa" },
  { href: "/domains", key: "nav_domains" },
  { href: "/roadmaps", key: "nav_roadmaps" },
  { href: "/jobs", key: "nav_jobs" },
  { href: "/billing", key: "nav_billing" },
];

export function NavbarShell({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();
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
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090a]/85 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-[#08090a]/70">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        {/* Logo */}
        <Link
          href={isLoggedIn ? "/dashboard" : "/"}
          onClick={close}
          className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#8b5cf6] text-base font-bold text-white shadow-glow-sm">
            Z
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            ZENVY
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 lg:flex">
          {!isLoggedIn && (
            <Link
              href="/#pricing"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#8a8f98] transition hover:bg-white/[0.06] hover:text-white"
            >
              {t("nav_pricing")}
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
                      ? "bg-[#5e6ad2]/15 text-white"
                      : "text-[#8a8f98] hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {t(l.key)}
                </Link>
              ))}
              <LanguageSwitcher className="ml-1.5" />
              <form action="/auth/signout" method="post" className="ml-1.5">
                <button className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-[#d0d6e0] shadow-sm transition hover:bg-white/[0.07]">
                  {t("nav_sign_out")}
                </button>
              </form>
            </>
          ) : (
            <>
              <LanguageSwitcher className="mr-1" />
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#8a8f98] transition hover:bg-white/[0.06] hover:text-white"
              >
                {t("nav_login")}
              </Link>
              <Link
                href="/signup"
                className="ml-1 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                {t("nav_get_started")}
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — p-2.5 keeps the tap target at ~44px */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex items-center justify-center rounded-lg border border-white/10 p-2.5 text-[#d0d6e0] transition hover:bg-white/[0.07] lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/[0.07] bg-[#0c0d10] px-4 pb-6 pt-2 shadow-lg lg:hidden">
          <div className="flex flex-col gap-0.5">
            {!isLoggedIn && (
              <Link
                href="/#pricing"
                onClick={close}
                className="rounded-xl px-3 py-3 text-sm font-medium text-[#d0d6e0] transition hover:bg-white/[0.06]"
              >
                {t("nav_pricing")}
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
                        ? "bg-[#5e6ad2]/15 text-white"
                        : "text-[#d0d6e0] hover:bg-white/[0.06]"
                    }`}
                  >
                    {t(l.key)}
                  </Link>
                ))}
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3">
                  <span className="text-xs font-medium text-[#62666d]">{t("nav_language")}</span>
                  <LanguageSwitcher />
                </div>
                <div className="mt-3 border-t border-white/[0.07] pt-3">
                  <form action="/auth/signout" method="post">
                    <button className="w-full rounded-xl border border-white/10 px-3 py-3 text-left text-sm font-medium text-[#d0d6e0] transition hover:bg-white/[0.06]">
                      {t("nav_sign_out")}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3">
                  <span className="text-xs font-medium text-[#62666d]">{t("nav_language")}</span>
                  <LanguageSwitcher />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={close}
                    className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-[#d0d6e0] transition hover:bg-white/[0.06]"
                  >
                    {t("nav_login")}
                  </Link>
                  <Link
                    href="/signup"
                    onClick={close}
                    className="rounded-xl bg-brand-gradient px-4 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    {t("nav_get_started")}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
