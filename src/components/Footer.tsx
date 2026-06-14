import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/#ats", label: "Free ATS Checker" },
  { href: "/builder", label: "Resume Builder" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/jobs", label: "Job Alerts (Pro)" },
];

const ACCOUNT_LINKS = [
  { href: "/signup", label: "Create account" },
  { href: "/login", label: "Log in" },
  { href: "/billing", label: "Billing" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      {/* Main footer grid */}
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <div className="lg:col-span-2">
            {/* ResumeBoost logo */}
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient shadow-sm">
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6-4h6M5 8h.01M5 12h.01M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" />
                </svg>
              </div>
              <span className="text-[17px] font-bold tracking-tight text-slate-900">
                Resume<span className="text-brand-600">Boost</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              AI-powered resume enhancement and ATS scoring. Upload, improve, pick a clean template,
              and export a polished PDF — completely free to start.
            </p>

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
                <p className="text-sm font-bold text-brand-800">Santo Square Automation</p>
              </div>
            </div>
          </div>

          {/* Product links */}
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

          {/* Account links */}
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
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-medium text-slate-500">Santo Square Automation</span>. All rights
            reserved.
          </p>
          <p className="text-center">
            ResumeBoost helps you improve your resume. Results vary — we do not guarantee job
            outcomes.
          </p>
        </div>
      </div>
    </footer>
  );
}
