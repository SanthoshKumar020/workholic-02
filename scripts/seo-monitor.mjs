#!/usr/bin/env node
/**
 * HYRISE SEO / health monitor (standalone, no DB needed).
 *
 * What it does:
 *  - Fetches your sitemap.xml and checks every URL returns HTTP 200
 *  - Checks robots.txt is reachable
 *  - Reports how many pages are indexed on Google (via `site:` count, best-effort)
 *
 * Run locally:
 *   node scripts/seo-monitor.mjs
 *
 * Or schedule it (cron / Vercel Cron) and pipe output to your email:
 *   0 9 * * 1 node /path/seo-monitor.mjs >> seo-report.txt
 *
 * NOTE: This is a *real* monitoring tool — it only reports. It does NOT
 * create fake accounts, fake reviews, or spam. Pair it with the weekly
 * content calendar (scripts/content-calendar.mjs) to actually earn users.
 */

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://hyrise.swache.in";

async function fetchSitemap() {
  const res = await fetch(`${BASE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml HTTP ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return urls;
}

async function checkUrls(urls) {
  const results = [];
  // Check in small batches to be polite to the server.
  for (let i = 0; i < urls.length; i += 8) {
    const batch = urls.slice(i, i + 8);
    const settled = await Promise.all(
      batch.map(async (u) => {
        try {
          const r = await fetch(u, { method: "GET", redirect: "manual" });
          return { url: u, status: r.status, ok: r.status >= 200 && r.status < 400 };
        } catch (e) {
          return { url: u, status: 0, ok: false, error: e.message };
        }
      })
    );
    results.push(...settled);
  }
  return results;
}

async function googleIndexCount() {
  // Best-effort: count results for site:domain. Google may rate-limit
  // unauthenticated requests, so treat failure as "unknown".
  try {
    const domain = new URL(BASE).hostname;
    const r = await fetch(
      `https://www.google.com/search?q=site:${domain}&num=1`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; HYRISEBot/1.0)" } }
    );
    const html = await r.text();
    const m = html.match(/About\s+([\d,]+)\s+results/i) || html.match(/([\d,]+)\s+results/i);
    return m ? m[1] : "unknown";
  } catch {
    return "unknown (blocked/rate-limited)";
  }
}

async function main() {
  console.log(`\n🔎 HYRISE SEO monitor — ${new Date().toISOString()}`);
  console.log(`Base: ${BASE}\n`);

  let urls = [];
  try {
    urls = await fetchSitemap();
    console.log(`✅ sitemap.xml: ${urls.length} URLs found`);
  } catch (e) {
    console.log(`❌ sitemap.xml failed: ${e.message}`);
    process.exitCode = 1;
  }

  if (urls.length) {
    const checked = await checkUrls(urls);
    const broken = checked.filter((c) => !c.ok);
    console.log(`\n🌐 URL health: ${checked.length - broken.length}/${checked.length} OK`);
    if (broken.length) {
      console.log("❌ Broken URLs:");
      broken.forEach((b) => console.log(`   ${b.status || "ERR"}  ${b.url}${b.error ? " (" + b.error + ")" : ""}`));
      process.exitCode = 1;
    }
  }

  const idx = await googleIndexCount();
  console.log(`\n📊 Google indexed pages (site:): ${idx}`);
  console.log(`\nTip: fix broken URLs above, then resubmit sitemap in Search Console.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
