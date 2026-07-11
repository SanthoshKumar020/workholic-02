import Link from "next/link";
import Image from "next/image";
import { SOCIAL_LINKS, SOCIAL_META, type SocialKey } from "@/lib/social";

const PRODUCT_LINKS = [
  { href: "/#ats", label: "Free ATS Checker" },
  { href: "/builder", label: "Resume Builder" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/jobs", label: "Job Alerts (Pro)" },
];

const RESOURCE_LINKS = [
  { href: "/blog", label: "Career Blog" },
  { href: "/resume-checker", label: "Resume Checker by Role" },
  { href: "/interview-questions", label: "Interview Questions by Role" },
];

const ACCOUNT_LINKS = [
  { href: "/signup", label: "Create account" },
  { href: "/login", label: "Log in" },
  { href: "/billing", label: "Billing" },
  { href: "/dashboard", label: "Dashboard" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/refund", label: "Refund Policy" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function Footer() {
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
              AI-powered career platform to help you land your next job faster. Resume enhancement, mock interviews, job matching, and more — free to start.
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
                  A product by
                </p>
                <p className="text-sm font-bold text-brand-800">Swache Technologies (OPC) Private Limited</p>
              </div>
            </div>
          </div>

          {/* Product + Resources links */}
          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Product
              </h3>
              <ul className="space-y-3">
                {PRODUCT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-brand-600"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Resources
              </h3>
              <ul className="space-y-3">
                {RESOURCE_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-brand-600"
                    >
                      {l.label}
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
                Account
              </h3>
              <ul className="space-y-3">
                {ACCOUNT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-brand-600"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Company
              </h3>
              <ul className="space-y-3">
                {COMPANY_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-brand-600"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Legal
              </h3>
              <ul className="space-y-3">
                {LEGAL_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-brand-600"
                    >
                      {l.label}
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
            <span className="font-medium text-slate-500">Swache Technologies (OPC) Private Limited</span>. All rights
            reserved.
          </p>
          <p className="text-center">
            Regd. office: L 303, Rohan Upavan, Kyalasanahalli, Kothanur, Bangalore North, Karnataka 560077 ·{" "}
            <a href="mailto:admin@swache.in" className="text-slate-500 hover:text-brand-600 hover:underline">
              admin@swache.in
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
