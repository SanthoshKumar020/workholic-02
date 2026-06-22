// Types + theme palettes for the AI Presentation Builder.

export type SlideLayout =
  | "title" // opening cover
  | "section" // section divider
  | "bullets" // heading + bullet points
  | "two-column" // two labelled columns of points
  | "quote" // big pull quote
  | "stat" // 1–3 big numbers
  | "closing"; // thank-you / call to action

export interface SlideStat {
  value: string;
  label: string;
}

export interface SlideColumn {
  heading: string;
  points: string[];
}

export interface Slide {
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  columns?: SlideColumn[];
  quote?: string;
  author?: string;
  stats?: SlideStat[];
  /** Presenter speaker notes. */
  notes?: string;
}

export type ThemeKey = "violet" | "midnight" | "sunset" | "emerald" | "mono";

export interface Deck {
  title: string;
  subtitle?: string;
  theme: ThemeKey;
  slides: Slide[];
}

export interface Theme {
  key: ThemeKey;
  name: string;
  /** CSS background (used by the web presenter). */
  css: string;
  /** Tailwind-ish accent for chips. */
  swatch: string;
  text: string; // main text color (hex)
  sub: string; // muted text (hex)
  accent: string; // accent (hex)
  /** Solid colours for the exported .pptx (no gradients there). */
  pptx: { bg: string; text: string; sub: string; accent: string };
}

export const THEMES: Record<ThemeKey, Theme> = {
  violet: {
    key: "violet",
    name: "Violet",
    css: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #9333ea 100%)",
    swatch: "bg-gradient-to-br from-indigo-500 to-purple-600",
    text: "#ffffff",
    sub: "#e9d5ff",
    accent: "#fbbf24",
    pptx: { bg: "4F46E5", text: "FFFFFF", sub: "E9D5FF", accent: "FBBF24" },
  },
  midnight: {
    key: "midnight",
    name: "Midnight",
    css: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
    swatch: "bg-gradient-to-br from-slate-800 to-slate-900",
    text: "#f8fafc",
    sub: "#94a3b8",
    accent: "#38bdf8",
    pptx: { bg: "0F172A", text: "F8FAFC", sub: "94A3B8", accent: "38BDF8" },
  },
  sunset: {
    key: "sunset",
    name: "Sunset",
    css: "linear-gradient(135deg, #b91c1c 0%, #ea580c 55%, #f59e0b 100%)",
    swatch: "bg-gradient-to-br from-red-600 to-amber-500",
    text: "#fff7ed",
    sub: "#fed7aa",
    accent: "#fde047",
    pptx: { bg: "C2410C", text: "FFF7ED", sub: "FED7AA", accent: "FDE047" },
  },
  emerald: {
    key: "emerald",
    name: "Emerald",
    css: "linear-gradient(135deg, #064e3b 0%, #059669 60%, #10b981 100%)",
    swatch: "bg-gradient-to-br from-emerald-800 to-emerald-500",
    text: "#ecfdf5",
    sub: "#a7f3d0",
    accent: "#fbbf24",
    pptx: { bg: "065F46", text: "ECFDF5", sub: "A7F3D0", accent: "FBBF24" },
  },
  mono: {
    key: "mono",
    name: "Mono (light)",
    css: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
    swatch: "bg-gradient-to-br from-slate-100 to-slate-300",
    text: "#0f172a",
    sub: "#475569",
    accent: "#4f46e5",
    pptx: { bg: "FFFFFF", text: "0F172A", sub: "475569", accent: "4F46E5" },
  },
};

export const THEME_LIST = Object.values(THEMES);

export function getTheme(key: ThemeKey | string | undefined): Theme {
  return THEMES[(key as ThemeKey) ?? "violet"] ?? THEMES.violet;
}

export const FREE_SLIDE_CAP = 8;
export const PRO_SLIDE_CAP = 30;
