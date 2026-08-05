"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/translations";

/** EN / தமிழ் toggle. Small enough to sit in the navbar on desktop and in the mobile menu. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("nav_language")}
      className={`inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs ${className}`}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
          className={`rounded-md px-2 py-1 font-medium transition ${
            locale === l ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
