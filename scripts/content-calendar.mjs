#!/usr/bin/env node
/**
 * HYRISE 30-day growth content calendar generator.
 *
 * Outputs a DRAFT posting schedule (social + blog) grounded in HYRISE's real
 * features. Everything is human-reviewed before posting — this script only
 * *drafts*, it never auto-posts spam. Tune the themes array to your niches.
 *
 * Run: node scripts/content-calendar.mjs
 *      node scripts/content-calendar.mjs --json   (machine-readable)
 *
 * To actually publish, wire the output into your Buffer/Hootsuite/Resend
 * accounts (see README in scripts/). Do NOT mass-DM or scrape contacts.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hyrise.swache.in";
const VIDEO_URL = `${APP_URL}/marketing/hyrise-explainer.mp4`;

// Themes map to real HYRISE features — keeps content authentic.
const FEATURES = [
  { name: "ATS Score Checker", hook: "Recruiters reject 75% of resumes before a human reads them. Check your ATS score free in 10 seconds.", link: "/#ats" },
  { name: "AI Resume Builder", hook: "Turn 'responsible for reports' into 'Owned weekly reporting that cut review time 30%.'", link: "/builder" },
  { name: "Mock Interview Coach", hook: "Practice the 20 questions you'll actually be asked — get STAR feedback instantly.", link: "/interview" },
  { name: "Job Match Analyzer", hook: "Paste a JD, see your % keyword match before you apply. Stop guessing.", link: "/match" },
  { name: "Learning Roadmaps", hook: "Zero to job-ready: step-by-step roadmaps with free YouTube resources.", link: "/roadmap" },
  { name: "Cover Letter Generator", hook: "A tailored cover letter in 30 seconds, not 45 minutes.", link: "/cover-letter" },
  { name: "Remote Job Search", hook: "Curated remote roles + daily alerts. Work from anywhere.", link: "/jobs" },
];

const PLATFORMS = ["LinkedIn", "Instagram (Reel)", "X (Twitter)", "YouTube Shorts"];
const DAYS = 30;

function pick(arr, i) { return arr[i % arr.length]; }

function buildCalendar() {
  const today = new Date();
  const out = [];
  for (let d = 0; d < DAYS; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dow = date.getDay(); // 0 Sun .. 6 Sat
    const isWeekend = dow === 0 || dow === 6;
    const feat = pick(FEATURES, d);

    let type, asset, cta;
    if (d === 0) {
      type = "Video launch";
      asset = `Explainer video → ${VIDEO_URL}`;
      cta = "Post to all platforms. Pin to profile.";
    } else if (d % 7 === 3) {
      type = "Blog post";
      asset = `SEO article: "${feat.name}: a free guide for Indian job seekers"`;
      cta = "Publish to /blog, then promote 1 clip on social.";
    } else if (isWeekend) {
      type = "Engagement post";
      asset = `Poll/question: "What's your biggest resume struggle?" + ${feat.name} link`;
      cta = "Reply to every comment within 2h.";
    } else {
      type = "Feature spotlight";
      asset = `${feat.hook} ${APP_URL}${feat.link}`;
      cta = `Schedule on ${pick(PLATFORMS, d)}.`;
    }
    out.push({
      day: d + 1,
      date: date.toISOString().slice(0, 10),
      weekday: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dow],
      type,
      asset,
      cta,
    });
  }
  return out;
}

const cal = buildCalendar();
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(cal, null, 2));
} else {
  console.log(`\n📅 HYRISE 30-day growth calendar (starts ${cal[0].date})`);
  console.log("─".repeat(70));
  for (const c of cal) {
    console.log(`${String(c.day).padStart(2)} ${c.weekday}  ${c.type.padEnd(16)} ${c.asset}`);
    console.log(`     ↳ ${c.cta}`);
  }
  console.log("\n⚠️  Draft only — review before scheduling. No auto-spam, no scraping.");
}
