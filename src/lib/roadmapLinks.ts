/**
 * Builds deterministic, safe links for each roadmap step.
 * We NEVER render raw URLs from the AI — we construct every link
 * from the query string so the destination is always trusted.
 */

function withLang(query: string, lang?: string): string {
  if (!lang || lang === "en") return query;
  return `${query} in ${lang}`;
}

export function youtubeLink(query: string, lang?: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(withLang(query, lang))}`;
}

export function buildYoutubeSearchUrl(query: string, lang?: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(withLang(query, lang))}`;
}

/** Coursera search — language appended to surface local results. */
export function freeCourseLink(query: string, lang?: string): string {
  return `https://www.coursera.org/search?query=${encodeURIComponent(withLang(query, lang))}`;
}

/** YouTube free course alternative. */
export function freeYouTubeLink(query: string, lang?: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(withLang(query, lang) + " free full course")}`;
}

/** Udemy paid course search. */
export function paidCourseLink(query: string, lang?: string): string {
  return `https://www.udemy.com/courses/search/?q=${encodeURIComponent(withLang(query, lang))}`;
}
