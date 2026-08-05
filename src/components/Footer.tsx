"use client";

import Link from "next/link";
import Image from "next/image";
import { SOCIAL_LINKS, SOCIAL_META, type SocialKey } from "@/lib/social";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";

const PRODUCT_LINKS: { href: string; key: TranslationKey }[] = [
  { href: "/#ats", key: "footer_link_ats" },
  { href: "/builder", key: "footer_link_builder" },
  { href: "/#pricing", key: "footer_link_pricing" },
  { href: "/jobs", key: "footer_link_jobs" },
];

const RESOURCE_LINKS: { href: string; key: TranslationKey }[] = [
  { href: "/blog", key: "footer_link_blog" },
  { href: "/resume-checker", key: "footer_link_resume_checker" },
  { href: "/interview-questions", key: "footer_link_interview_questions" },
];

const ACCOUNT_LINKS: { href: string; key: TranslationKey }[] = [
  { href: "/signup", key: "footer_link_create_account" },
  { href: "/login", key: "footer_link_login" },
  { href: "/billing", key: "footer_link_billing" },
  { href: "/dashboard", key: "footer_link_dashboard" },
];

const COMPANY_LINKS: { href: string; key: TranslationKey }[] = [
  { href: "/about", key: "footer_link_about" },
  { href: "/contact", key: "footer_link_contact" },
  { href: "/refund", key: "footer_link_refund" },
  { href: "/affiliate-disclosure", key: "footer_link_affiliate" },
];

/**
 * The B2B entry point. /for-colleges had no inbound link anywhere, which for
 * a page whose whole job is to be found by a placement officer meant it might
 * as well not exist — neither Google nor a TPO browsing the site could reach
 * it.
 */
const INSTITUTION_LINKS: { href: string; key: TranslationKey }[] = [
  { href: "/for-colleges", key: "footer_link_for_colleges" },
  { href: "/for-colleges#pricing", key: "footer_link_college_pricing" },
  { href: "/join", key: "footer_link_join_college" },
];

const LEGAL_LINKS: { href: string; key: TranslationKey }[] = [
  { href: "/privacy", key: "footer_link_privacy" },
  { href: "/terms", key: "footer_link_terms" },
];

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      {/* Main footer grid */}
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center group">
              <Image src="/logo.png" alt="HYRISE" width={120} height={40} className="h-9 w-auto object-contain" />
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              {t("footer_tagline")}
            </p>

            {/* Social links */}
            <div className="mt-5 flex items-center gap-3">
              {(Object.keys(SOCIAL_LINKS) as SocialKey[])
                .filter((k) => SOCIAL_LINKS[k])
                .map((k) => (
                  <a
                    key={k}
                    href={SOCIAL_LINKS[k]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_META[k].label}
                    title={SOCIAL_META[k].label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <span className="text-xs font-bold uppercase">{k[0]}</span>
                  </a>
                ))}
            </div>

            {/* Company attribution */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-gradient">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-white">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1zm0 6a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-brand-500">
                  {t("footer_product_by")}
                </p>
                <p className="text-sm font-bold text-brand-800">Swache Technologies (OPC) Private Limited</p>
              </div>
            </div>
          </div>

          {/* Product + Resources links */}
          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {t("footer_section_product")}
              </h3>
              <ul className="space-y-3">
                {PRODUCT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-brand-600"
                    >
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {t("footer_section_resources")}
              </h3>
              <ul className="space-y-3">
                {RESOURCE_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-brand-600"
                    >
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Account + Legal links */}
          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {t("footer_section_account")}
              </h3>
              <ul className="space-y-3">
                {ACCOUNT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-brand-600"
                    >
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {t("footer_section_company")}
              </h3>
              <ul className="space-y-3">
                {COMPANY_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-brand-600"
                    >
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {t("footer_section_institutions")}
              </h3>
              <ul className="space-y-3">
                {INSTITUTION_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-brand-600"
                    >
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {t("footer_section_legal")}
              </h3>
              <ul className="space-y-3">
                {LEGAL_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-brand-600"
                    >
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-medium text-slate-500">Swache Technologies (OPC) Private Limited</span>. {t("footer_rights")}
          </p>
          {/* CIN display is a statutory requirement for an Indian company
              under s.12(3)(c) of the Companies Act 2013, not an optional
              trust signal — and a TPO evaluating you for a college contract
              will look for it. Set NEXT_PUBLIC_COMPANY_CIN (and GSTIN once
              registered) in Vercel; both are public information, so they are
              safe as NEXT_PUBLIC_ vars. */}
          <p className="text-center">
            Regd. office: L 303, Rohan Upavan, Kyalasanahalli, Kothanur, Bangalore North, Karnataka 560077 ·{" "}
            <a href="mailto:admin@swache.in" className="text-slate-500 hover:text-brand-600 hover:underline">
              admin@swache.in
            </a>
            {process.env.NEXT_PUBLIC_COMPANY_CIN && (
              <> · CIN: {process.env.NEXT_PUBLIC_COMPANY_CIN}</>
            )}
            {process.env.NEXT_PUBLIC_COMPANY_GSTIN && (
              <> · GSTIN: {process.env.NEXT_PUBLIC_COMPANY_GSTIN}</>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
