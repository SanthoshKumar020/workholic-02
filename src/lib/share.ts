/** Share helpers. India shares on WhatsApp — that's the primary CTA. */

export const SITE_URL = "https://hyrise.swache.in";

/**
 * Build a WhatsApp share deep link. Works on both mobile (opens the app)
 * and desktop (opens WhatsApp Web) via the official wa.me endpoint.
 */
export function whatsappShareUrl(text: string, url?: string): string {
  const message = url ? `${text}\n\n${url}` : text;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Generic share text builders for common result types. */
export const shareText = {
  ats: (score: number) =>
    `I scored ${score}/100 on my ATS resume check with HYRISE 🎉 Check yours free 👇`,
  match: (score: number) =>
    `My resume is a ${score}% match for the job I want — checked free on HYRISE 🎯`,
  interview: (score: number, grade: string) =>
    `I scored ${score}/100 (grade ${grade}) on my AI mock interview with HYRISE 🎤 Practice yours free 👇`,
  certificate: (title: string) =>
    `I just earned my "${title}" certificate on HYRISE 🏆 Build your career profile free 👇`,
};
