export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  accent: string;
  pro: boolean;
  layout: "single" | "sidebar" | "banner";
  preview: {
    bg: string;
    header: string;
    bar: string;
    text: string;
  };
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Centered name, double-rule separators, clean black & white. HR favourite.",
    accent: "#1a1a1a",
    pro: false,
    layout: "single",
    preview: { bg: "#ffffff", header: "#1a1a1a", bar: "#333333", text: "#333333" },
  },
  {
    id: "executive",
    name: "Executive",
    description: "Clean navy headings with bold section lines. Best ATS score.",
    accent: "#1e3a5f",
    pro: false,
    layout: "single",
    preview: { bg: "#ffffff", header: "#1e3a5f", bar: "#1e3a5f", text: "#374151" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Lots of whitespace, subtle grey accents. Ultra-readable.",
    accent: "#6b7280",
    pro: false,
    layout: "single",
    preview: { bg: "#fafafa", header: "#111827", bar: "#d1d5db", text: "#6b7280" },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Deep indigo sidebar with white text. Eye-catching.",
    accent: "#4338ca",
    pro: true,
    layout: "sidebar",
    preview: { bg: "#ffffff", header: "#4338ca", bar: "#4338ca", text: "#1f2937" },
  },
  {
    id: "teal",
    name: "Sharp Teal",
    description: "Teal sidebar, crisp two-column layout. Great for tech roles.",
    accent: "#0d9488",
    pro: true,
    layout: "sidebar",
    preview: { bg: "#ffffff", header: "#0d9488", bar: "#0d9488", text: "#1f2937" },
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Serif name, burgundy accents. Traditional and trustworthy.",
    accent: "#9b1c1c",
    pro: true,
    layout: "single",
    preview: { bg: "#fffbfb", header: "#9b1c1c", bar: "#9b1c1c", text: "#374151" },
  },
  {
    id: "impact",
    name: "Impact",
    description: "Bold full-width color header. Stands out instantly.",
    accent: "#1d4ed8",
    pro: true,
    layout: "banner",
    preview: { bg: "#ffffff", header: "#ffffff", bar: "#1d4ed8", text: "#1f2937" },
  },
];

export function getTemplate(id: string): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
