"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { translations, interpolate, type Locale, type TranslationKey } from "./translations";

export const LANG_COOKIE = "hyrise_lang";
const LANG_STORAGE_KEY = "hyrise_lang";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a key, with optional {placeholder} interpolation. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Wraps the app. `initialLocale` is read server-side (from the `hyrise_lang`
 * cookie) in the root layout and passed in here so the very first paint is
 * already in the right language — no flash of English before a saved Tamil
 * preference kicks in.
 */
export function LanguageProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof document !== "undefined") {
      // 1 year, readable by the server on the next request so SSR picks it up too.
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, next);
      } catch {
        // Storage can be unavailable (private mode, quota) — the cookie still works.
      }
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const table = translations[locale] ?? translations.en;
      const raw = (table as Record<string, string>)[key] ?? translations.en[key] ?? key;
      return interpolate(raw, vars);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fail soft rather than crashing a page that forgot the provider — worst
    // case it renders English, which is always correct as a fallback.
    return { locale: "en", setLocale: () => {}, t: (key) => translations.en[key] ?? key };
  }
  return ctx;
}
