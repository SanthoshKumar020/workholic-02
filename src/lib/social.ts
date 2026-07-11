// ── HYRISE social presence ─────────────────────────────────────────────────
// Fill these in with your REAL handles. They're used in the footer and in
// generated share URLs. Leave a value blank ("") to hide that icon.
//
// Tip: set these via env vars (NEXT_PUBLIC_*) so you can change them without
// a code edit. Falls back to the hardcoded defaults below.

export const SOCIAL_LINKS = {
  linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || "https://www.linkedin.com/company/hyrise",
  twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || "https://x.com/hyrise",
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "https://www.instagram.com/hyrise.careers",
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || "https://www.youtube.com/@hyrise",
  whatsapp: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP || "", // e.g. "https://wa.me/919999999999"
} as const;

export type SocialKey = keyof typeof SOCIAL_LINKS;

export const SOCIAL_META: Record<
  SocialKey,
  { label: string; handle: string }
> = {
  linkedin: { label: "LinkedIn", handle: "linkedin.com/company/hyrise" },
  twitter: { label: "X (Twitter)", handle: "x.com/hyrise" },
  instagram: { label: "Instagram", handle: "instagram.com/hyrise.careers" },
  youtube: { label: "YouTube", handle: "youtube.com/@hyrise" },
  whatsapp: { label: "WhatsApp", handle: "wa.me" },
};

// Used by share buttons / automation to build share URLs.
export function shareUrl(platform: SocialKey, url: string, text: string): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  switch (platform) {
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case "whatsapp":
      return `https://wa.me/?text=${t}%20${u}`;
    default:
      return SOCIAL_LINKS[platform] || url;
  }
}
