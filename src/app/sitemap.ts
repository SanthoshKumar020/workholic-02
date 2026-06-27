import type { MetadataRoute } from "next";
import { APTITUDE_CATEGORIES } from "@/lib/aptitude-topics";
import { DOMAINS } from "@/lib/domains/catalog";
import { ISLANDS } from "@/lib/dsa/curriculum";

const BASE_URL = "https://hyrise.swache.in";

function url(path: string, priority: number, changefreq: "daily" | "weekly" | "monthly"): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: changefreq,
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  // ── Static public pages ───────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    url("/",                  1.0, "weekly"),
    url("/builder",           0.9, "weekly"),
    url("/match",             0.9, "weekly"),
    url("/interview",         0.9, "weekly"),
    url("/roadmap",           0.9, "weekly"),
    url("/roadmaps",          0.8, "daily"),
    url("/aptitude",          0.9, "weekly"),
    url("/dsa",               0.9, "weekly"),
    url("/domains",           0.9, "weekly"),
    url("/english",           0.8, "weekly"),
    url("/outreach",          0.8, "weekly"),
    url("/gd",                0.8, "weekly"),
    url("/company-prep",      0.8, "weekly"),
    url("/cover-letter",      0.8, "weekly"),
    url("/tailor",            0.8, "weekly"),
    url("/recruiter-scan",    0.7, "weekly"),
    url("/profile-optimizer", 0.7, "weekly"),
    url("/salary",            0.7, "weekly"),
    url("/jobs",              0.7, "daily"),
    url("/tracker",           0.7, "weekly"),
    url("/videos",            0.7, "daily"),
    url("/mentor",            0.7, "weekly"),
    url("/communication",     0.7, "weekly"),
    url("/billing",           0.6, "monthly"),
  ];

  // ── Aptitude topics ───────────────────────────────────────────────────────
  const aptitudePages: MetadataRoute.Sitemap = APTITUDE_CATEGORIES.flatMap((cat) =>
    cat.topics.map((topic) => url(`/aptitude/${topic.id}`, 0.7, "monthly"))
  );

  // ── DSA islands (only built ones) ─────────────────────────────────────────
  const dsaPages: MetadataRoute.Sitemap = ISLANDS.filter((i) => i.built).map((island) =>
    url(`/dsa/${island.slug}`, 0.7, "monthly")
  );

  // ── Domain hub pages ──────────────────────────────────────────────────────
  const domainHubPages: MetadataRoute.Sitemap = DOMAINS.map((d) =>
    url(`/domains/${d.slug}`, 0.7, "weekly")
  );

  // ── Domain topic pages ────────────────────────────────────────────────────
  const domainTopicPages: MetadataRoute.Sitemap = DOMAINS.flatMap((d) =>
    d.roadmap.map((topic) => url(`/domains/${d.slug}/${topic.slug}`, 0.6, "monthly"))
  );

  return [
    ...staticPages,
    ...aptitudePages,
    ...dsaPages,
    ...domainHubPages,
    ...domainTopicPages,
  ];
}
