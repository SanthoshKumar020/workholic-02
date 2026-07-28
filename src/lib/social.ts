// ── HYRISE social presence ─────────────────────────────────────────────────
// Each icon appears in the footer ONLY when its env var is set. That default
// is deliberate: these previously fell back to guessed handles
// (linkedin.com/company/hyrise, x.com/hyrise, …). If an account doesn't exist,
// a visitor clicking it lands on a 404 — or on a stranger's profile with your
// brand name. An absent icon costs nothing; a dead one costs trust.
//
// Set these in Vercel → Settings → Environment Variables as you create each
// account, then redeploy. No code change needed.
//
//   NEXT_PUBLIC_SOCIAL_LINKEDIN=https://www.linkedin.com/company/your-page
//   NEXT_PUBLIC_SOCIAL_TWITTER=https://x.com/yourhandle
//   NEXT_PUBLIC_SOCIAL_INSTAGRAM=https://www.instagram.com/yourhandle
//   NEXT_PUBLIC_SOCIAL_YOUTUBE=https://www.youtube.com/@yourchannel
//   NEXT_PUBLIC_SOCIAL_WHATSAPP=https://wa.me/919999999999

export const SOCIAL_LINKS = {
  linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || "",
  twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || "",
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "",
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || "",
  whatsapp: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP || "",
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
