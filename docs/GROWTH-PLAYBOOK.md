# HYRISE — Zero-Budget Growth Playbook

_Written July 2026. Assumes: live at hyrise.swache.in, near-zero traffic, no ad spend._

---

## 0. The one thing to internalise

You have ~30 tools and almost no users. That is not a product problem — it is a
**distribution and measurement** problem. Adding a 31st tool will not fix it.

Until you have 1,000 monthly visitors, spend **80% of your time on distribution
and 20% on product**. Reverse that ratio only after a channel starts working.

---

## 1. What was broken (now fixed in code)

| Problem | Impact | Status |
| --- | --- | --- |
| Homepage promised "no login needed" but `/api/ats-check` returned **401** for logged-out users | Every first-time visitor who tried your headline lead magnet hit an error. This alone could account for near-zero signups. | ✅ Fixed — anonymous users get 3 scans/day, real score, 2 fixes, rest behind a free account |
| No analytics of any kind | You cannot tell whether the problem is traffic, the landing page, or the signup step | ✅ Fixed — set `NEXT_PUBLIC_GA_ID` and funnel events start flowing |
| H1 had no searchable keyword ("Your complete AI career platform in one place") | Nothing for Google to rank on | ✅ Fixed — H1 now leads with "Check your resume's ATS score free — no signup" |
| Fake `aggregateRating` in JSON-LD (4.8 from 1,240 ratings) | Google treats unverifiable review markup as spam; risks a manual action on the whole domain | ✅ Removed |
| Shared WhatsApp links had no UTM tags | All viral traffic looked like "direct" — the loop was unmeasurable | ✅ Fixed |
| No FAQ schema | Missing free SERP real estate | ✅ Added FAQPage structured data + visible FAQ |

### Do this before anything else (30 minutes)

1. Create a **Google Analytics 4** property → put the `G-XXXXXXXXXX` ID in
   `NEXT_PUBLIC_GA_ID` on Vercel → redeploy.
2. Verify the site in **Google Search Console** → put the code in
   `NEXT_PUBLIC_GOOGLE_VERIFICATION` → submit `https://hyrise.swache.in/sitemap.xml`.
3. Open the site in an incognito window, upload a resume, and confirm you get a
   score without logging in. This is your entire funnel — test it weekly.
4. Run a **PageSpeed Insights** check on the homepage. Anything under 70 on
   mobile is costing you both rankings and signups.

---

## 2. The funnel you are now measuring

```
Visitor  →  ats_check_started  →  ats_check_completed  →  signup_cta_clicked  →  signup_completed  →  upgrade_clicked
```

Healthy-ish benchmarks for a free tool like this:

| Step | If you're below this, that's the bottleneck |
| --- | --- |
| Visitor → started a scan | 20% |
| Started → completed | 85% (below this = upload/parsing bugs) |
| Completed → clicked signup | 25% |
| Clicked → account created | 50% |
| Free → Pro | 1–3% |

Check these numbers **every Monday**. Fix the worst step. Ignore everything else.

---

## 3. SEO — your only sustainable free channel

You already have the machinery: programmatic pages for 35 roles, a blog, a
sitemap. The gaps are volume and intent-matching.

### 3.1 Target the searches that convert

Indian job seekers type long, specific queries. Rank for those, not for
"resume builder" (Naukri and Canva own it).

Priority keyword clusters, in order:

1. `ats resume checker free` / `resume ats score check online india`
2. `resume format for freshers <year>` — enormous volume in India, low competition
3. `<role> resume format` — you have 35 roles; go to 150+
4. `<company> interview questions` — TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, HCL, Deloitte, Amazon India, Zoho, Freshworks. You already have `src/lib/company-data.ts` — turn it into indexable pages
5. `<role> fresher salary in india` — you have `/salary`; make role-specific static pages
6. `resume for <college-tier> students` / `internship resume format`

### 3.2 Concrete SEO tasks (in priority order)

- [ ] Expand `SEO_ROLES` from 35 → 150. Every role gets `/resume-checker/<role>`
      and `/interview-questions/<role>`. This is a data-entry job, not an
      engineering one, and it is the highest-leverage hour you can spend.
- [ ] Build `/company/<slug>/interview-questions` from `company-data.ts`.
      ~40 companies × real content = 40 pages targeting high-intent searches.
- [ ] Add `/resume-format/<role>` pages with a downloadable example — this is the
      single biggest Indian search cluster and you have the PDF templates already.
- [ ] Every programmatic page needs: unique H1, 300+ words of genuinely
      role-specific text (not spun boilerplate), FAQ schema, and 3–5 internal
      links to sibling pages. Thin duplicate pages get ignored or penalised.
- [ ] Publish **2 blog posts a week**. You have 8 posts; you need 50 before
      organic traffic compounds. Write for one query each, 1,200+ words.
- [ ] Internal linking: every blog post links to the ATS checker with keyword
      anchor text. Every role page links to 3 related roles.
- [ ] Add `lastModified` accuracy to the sitemap (currently `new Date()` on
      every request, which tells Google nothing).

### 3.3 Realistic timeline

New domains sit in a credibility gap for roughly 3–6 months. Expect close to
nothing for 8–12 weeks, then a slow ramp. **This is why you must also run the
manual channels in section 4** — they produce users this month, not next quarter.

---

## 4. Manual distribution — the first 100 users

Nobody finds a new site by accident. For the next 30 days, your job is to put
the free ATS checker in front of people who are actively job hunting.

### 4.1 Reddit (highest signal for Indian tech job seekers)

Communities: `r/developersIndia`, `r/IndianWorkplace`, `r/JobsIndia`,
`r/india_tech`, `r/btechtards`, `r/EngineeringStudents`, `r/resumes`,
`r/leetcode`, `r/cscareerquestionsIN`.

**The rule that decides whether this works:** do not post links. Reddit will
bury you and may ban the domain. Instead:

- Spend two weeks answering resume questions with genuinely useful, specific
  advice — no link, no mention.
- Once you have comment karma, offer free manual resume reviews in a comment
  thread. Review 20 resumes properly. Some of those people will ask what you do.
- Only then post a "I built a free ATS checker, no signup, roast it" thread in
  the subs that allow it. Frame it as asking for feedback, not announcing a
  product. Respond to every comment.

Realistic outcome: one good thread = 200–2,000 visitors in 48 hours.

### 4.2 LinkedIn (your best owned channel)

You are selling a career product to people who are on LinkedIn daily.

- Post **3× per week** from your personal profile, not a company page. Company
  pages get almost no reach without ad spend.
- Format that works: a specific before/after. "This resume bullet got 0
  callbacks. Here's the rewrite that got 4 interviews." Screenshot both.
  Explain why. Link in the first comment, never in the post body.
- Comment thoughtfully on posts from Indian HR and recruiter accounts every
  morning. Ten good comments a day compounds faster than your own posts do.
- DM every person who reacts to a resume-related post with a genuine offer of a
  free review. This converts unusually well and costs nothing but time.

### 4.3 College placement cells (the highest-leverage Indian channel)

One TPO email reaches 500–3,000 final-year students at once, all of whom need a
resume in the same six-week window.

- Build a list of 100 tier-2/tier-3 engineering colleges in Karnataka, TN, AP,
  Telangana, and Maharashtra. Find the Training & Placement Officer email.
- Offer, for free: a 45-minute online "ATS and resume" session for their batch,
  plus unlimited Pro access for their students for one placement season.
- What you get: a captive audience, real user feedback, testimonials with names
  and colleges, and word of mouth inside WhatsApp batch groups.
- A single placement-season deal with one college can outperform three months
  of SEO.

### 4.4 WhatsApp and Telegram

India shares on WhatsApp — you already built the share button, and it now
carries UTM tags so you can measure it.

- Join 20–30 Telegram/WhatsApp job-alert groups (search "off campus drive",
  "fresher jobs India"). Be a helpful member for two weeks before you ever
  mention HYRISE.
- Make the score card worth forwarding: a person who scored 78/100 should get a
  message their friends will actually open.
- **Highest-ROI product change in this document:** turn the ATS result into a
  downloadable/shareable **image card** (score ring, top issues blurred, your
  URL). Text links get ignored in WhatsApp; images get forwarded.

### 4.5 Launch platforms (one-time spikes, do them all in week 3)

Product Hunt, BetaList, Indie Hackers, Hacker News (Show HN), Peerlist (strong
Indian audience), Uneed, SaaSHub, AlternativeTo, Toolify, There's An AI For
That, Futurepedia, ProductHunt alternatives directories, and the "free tools"
lists on Reddit and Notion.

Each is worth a few hundred visitors and — more valuably — a backlink. Backlinks
are what get your SEO out of the credibility gap.

### 4.6 Quora and YouTube

- Quora India still ranks well for "how to make resume ATS friendly" style
  questions. Answer 3 per week with real substance.
- You already have `public/marketing/` scenes and a voiceover. Cut them into
  30-second YouTube Shorts and Instagram Reels: "3 words that get your resume
  rejected." Post daily for 30 days. Most will flop; one may not.

---

## 5. Product changes that directly drive growth

Ranked by impact per hour of work.

1. **Shareable score image card.** Generate a PNG of the ATS result (Next.js
   `ImageResponse` — you already use it for `opengraph-image.tsx`). One image
   per score. This is what makes the WhatsApp loop actually work.
2. **Public result pages.** Give every scan a URL like `/s/<id>` showing the
   score and blurred fixes. Shareable *and* indexable — every share becomes a
   backlink.
3. **Referral unlock.** "Invite 2 friends → 1 month of Pro free." Cheap for you
   (your marginal cost is Groq tokens), and it turns your only asset — users —
   into distribution.
4. **Unlock more tools for logged-out visitors.** The cover-letter generator and
   job-match analyzer make excellent second lead magnets. Same pattern as the
   ATS checker: real output, partial reveal, signup for the rest.
5. **Onboarding email sequence.** You have Resend. Send day 0 (welcome + one
   tip), day 2 (did you try the job matcher?), day 5 (mock interview), day 9
   (upgrade offer). Most signups never return without a nudge.
6. **Fix the free-tier story.** "3 uses per tool" across ~15 tools is generous
   enough that nobody needs Pro. Consider: unlimited ATS checks (it's the hook),
   but 1 free AI resume rewrite and 1 mock interview. Give away the top of the
   funnel, charge for the depth.
7. **Real testimonials.** The current ones need to be replaced with named,
   photographed users from your first college partnership. Fake-looking social
   proof reduces trust more than none.

---

## 6. The 30-day plan

**Week 1 — Instrument and verify**

- GA4 + Search Console live; sitemap submitted
- Test the logged-out ATS flow on a real phone
- Write 2 blog posts
- Start commenting (no links) on Reddit + LinkedIn daily
- Build the college TPO list (100 rows)

**Week 2 — Content and outreach**

- Expand `SEO_ROLES` to 100+
- Ship the shareable score image card
- 2 more blog posts
- Email 50 TPOs
- Offer 20 free resume reviews on Reddit; deliver all of them properly

**Week 3 — Launch spike**

- Product Hunt + Peerlist + BetaList + Show HN on the same day
- Submit to 10 AI-tool directories
- First "roast my tool" Reddit post
- 3 LinkedIn posts

**Week 4 — Compound and measure**

- Ship company interview-question pages
- Onboarding email sequence live
- Referral unlock live
- Review the funnel numbers. Whichever step is worst, that is all of next
  month's work.

**Success looks like:** 1,000 visitors, 150 ATS scans, 40 signups, 1–2 Pro
conversions in month one. That is a working machine, not a big number — the
point is that every step is now measurable and improvable.

---

## 7. What to ignore

- Building more tools. You have too many already; the message is diluted.
- Paid ads at ₹30/month pricing — you cannot win an auction against Naukri when
  your LTV is ₹360/year. Ads only make sense after a college/B2B motion proves out.
- Twitter/X. Almost none of your users are there.
- Chasing "resume builder" as a keyword. You will not outrank Canva. Own
  "ATS score checker India" and the long tail instead.

---

## 8. Pricing note

₹30/month is priced like a chai, which is charming positioning but means you
need ~3,000 paying users to make ₹90k MRR. Two things worth testing later:

- A **₹199 one-time "placement season pass"** (3 months). Indian students
  convert far better on one-time payments than subscriptions.
- **B2B/college licensing**: ₹15,000–50,000 per college per placement season for
  bulk student access. One deal equals hundreds of individual subscriptions and
  comes with built-in distribution.

Neither needs new code — just a new price and a conversation.
