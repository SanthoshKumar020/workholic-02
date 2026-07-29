# HYRISE — full product analysis

_July 2026. hyrise.swache.in · Swache Technologies (OPC) Pvt Ltd_

Written from the codebase, the live site, and a session's worth of auditing —
security, UI/UX, gamification and growth. Where I found something broken I've
said so plainly, because a list of compliments wouldn't help you.

**Scale:** 37,800 lines, 44 page routes, 63 API routes, 128 components,
21 user-facing tools, **0 tests**.

---

## 0. The verdict in one paragraph

You have built, alone, something with the surface area of a Series-A product.
The engineering is real: DSA visualisers, spaced repetition, PDF generation,
three payment integrations, programmatic SEO. That is genuinely impressive and
you should not discount it.

But the product has **21 tools and almost no users**, and this session found
that several of those tools were quietly broken in production — XP and streaks
never recorded at all, onboarding failed for every new signup, the daily job
alerts emailed AI-invented listings, and any logged-in user could grant
themselves Pro from the browser console. None of that was visible from the
outside, which is the real problem: **you have been building features faster
than you can verify them.**

The single highest-leverage change is not another tool. It is to stop, make
the twenty-one you have demonstrably work, and put the effort into
distribution instead.

---

## 1. What is genuinely strong

**The breadth is a real moat — once it works.** Naukri does job listings.
Canva does templates. Nobody in the Indian market does resume → ATS → tailoring
→ mock interview → DSA → aptitude → placement analytics in one login at ₹30.
That's a defensible position, and it's why the college motion is so promising.

**The free ATS checker is the right lead magnet.** No signup, 20 seconds,
genuinely useful output. Most competitors gate this. Keep it free forever —
it's the top of everything.

**Programmatic SEO is already scaffolded.** `SEO_ROLES` (35 roles), blog,
sitemap, per-role resume-checker and interview-question pages. The machinery
exists; it just needs volume.

**The DSA module is the best-built thing you have.** Visualisers, a Pyodide
code runner, SM-2 spaced repetition, mascot, confetti, island progression.
This is a product in its own right and it is better than the rest of the app.

**Pricing is honest and the disclaimers are real.** "We do not guarantee
interviews, offers, or employment" appears on the pricing section. In a
category full of placement-guarantee scams, that's an asset — lean into it.

**You accepted every hard correction in this session** — removed fake
testimonials, removed fabricated review markup, replaced invented job listings.
That instinct matters more than any feature.

---

## 2. What is weak or broken

### 2.1 Verification — the root cause

Zero tests across 37,800 lines. No CI until this week. Consequently:

| Bug | How long it was live | How it was found |
| --- | --- | --- |
| Any user could self-grant Pro | Since launch | Security audit |
| XP/streaks never recorded (`last_active` column absent) | Since launch | A migration failed |
| Onboarding unreachable (`/auth/callback` ignored it) | Since launch | Code audit |
| Job alerts emailed invented listings | Since launch | Code audit |
| ATS checker 401'd for logged-out users | Since launch | Code audit |
| Placeholder testimonials on the live homepage | Unknown | **You saw it** |

Every one was silent. Nothing alerted, nothing logged, no user complained —
they just left. **This is the pattern to fix, not the individual bugs.**

### 2.2 Schema drift

`supabase/schema.sql` defines 5 columns on `profiles`. The app uses ~18. The
rest were added ad hoc and `last_active` never was. Anyone rebuilding the
database from this repo gets a broken app. Four separate user-facing bugs this
week traced back to it.

**Fix:** `pg_dump --schema-only` and reconcile into a baseline migration. One
hour, ends the whole class of failure.

### 2.3 Everything is behind a login wall

16 of 23 routes redirect logged-out visitors to `/login`. The one thing they
can use is the ATS checker. For a product with no brand and no traffic, that
is backwards — every tool should have a try-before-signup path like the ATS
checker now does.

### 2.4 The free tier undermines the paid tier

"3 uses per tool" across ~15 tools is ~45 free AI operations. That is enough
that nobody needs Pro. Meanwhile Pro at ₹30/month needs ~3,000 subscribers to
reach ₹90k MRR — implausible at current traffic.

**Fix:** give away the top of the funnel generously (unlimited ATS checks —
it's the hook), charge for depth (1 free AI rewrite, 1 mock interview). And
test a ₹499 three-month "Job Hunt Pass" — job hunting is a burst activity, and
a fixed term matches intent far better than a subscription people forget to
cancel.

### 2.5 No proof the product works

`resumes.ats_score` is timestamped on every enhance, so "61 → 84" was always
derivable — and was never shown. Free users couldn't see score history at all,
which hid the exact evidence that justifies upgrading. (A trend chart now
exists on the dashboard.)

### 2.6 Design system fragmentation

128 hand-rolled card divs, ~12 different button/pill treatments, 5 duplicated
resume-upload zones, `ui/Card` and `ui/Dialog` written and never imported.
Page shells vary from `max-w-3xl` to `max-w-7xl`. It reads as several products
stitched together, because it was built over many months without a system.

### 2.7 Trust surface

Two things I removed were actively dangerous: fabricated `aggregateRating`
JSON-LD (a Google manual-action risk for the whole domain) and AI-invented job
listings sent by email to people actively job hunting. Both would have been
fatal to trust the first time someone checked.

Still outstanding: transactional email sends from `onboarding@resend.dev`, a
shared sandbox domain. Your Pro upgrade confirmations look like spam.

---

## 3. Tool-by-tool assessment

### Resume group

| Tool | State | Needed |
| --- | --- | --- |
| ATS checker | **Strongest asset.** Anonymous, fast, real output | Unlimited for free users. It's the hook, not the product |
| Resume builder | Works; 18 hand-rolled cards, densest UI in the app | Autosave, version compare ("what changed?"), migrate to `ui/Card` |
| Job match analyzer | High-intent; the "you're missing Kubernetes" moment | Show gaps as a checklist you can act on, not prose. This is where affiliate recs belong |
| Tailoring | Genuinely differentiated | Save tailored versions per company; pairs with the tracker |
| Recruiter scan | Good idea | Layout squashes on mobile; make the 6-second framing visual |
| Cover letter | Commodity | Lowest-value tool you have. Fine, don't invest |

### Interview group

| Tool | State | Needed |
| --- | --- | --- |
| Mock interview | Best Pro justification | Session history + score trend. A single session is a novelty; a trend is a habit |
| Company prep | Strong India fit (TCS, Infosys…) | Static `company-data.ts` → indexable public pages. Big SEO win, currently invisible |
| GD practice | Very India-specific, rare | Underexposed — most users won't know it exists |
| Salary coach | Pro-gated | Needs real India salary data; AI-guessed numbers here are the same trust risk as invented jobs |

### Skills group

| Tool | State | Needed |
| --- | --- | --- |
| DSA adventure | **Best-built module** | Surface it outside `/dsa`. Its progression loop should drive the whole dashboard |
| Aptitude | Solid placement fit | Timed mock tests — that's how placement rounds actually work |
| Domains / roadmaps | Content-heavy | Overlaps with DSA and aptitude; consider merging |
| English | Good India fit | Underexposed |

### Job hunt group

| Tool | State | Needed |
| --- | --- | --- |
| Job search | Real Remotive data | Remote-only, mostly non-Indian. Weakest fit for your audience |
| Tracker | Genuinely useful, was **unreachable** for signed-in users | Now linked. Add follow-up reminders via the nudge cron |
| Outreach | Useful | Fine |
| Profile optimizer | Useful | Fine |
| Mentor | Ambitious | Errors were silently swallowed — a failed reply showed nothing at all |

---

## 4. New features worth building — ranked

**1. Placement-readiness PDF report (colleges).**
The artifact a TPO forwards to their principal. Turns a demo into a contract.
Highest revenue-per-hour of anything on this list.

**2. Try-before-signup on 3 more tools.**
Job match, cover letter, company prep. Same teaser pattern as the ATS checker.
Triples your top-of-funnel entry points.

**3. Company interview-question pages, public and indexable.**
`company-data.ts` already holds the content. ~40 pages targeting
"TCS interview questions" — enormous Indian search volume, and you're sitting
on the data.

**4. Resume version compare.**
"Here's what changed and why your score moved 61 → 84." Proof of value in one
screen, and nobody in this market does it well.

**5. Referral unlock.**
"Invite 2 friends → 1 month Pro." Your marginal cost is Groq tokens. Cheapest
acquisition available.

**6. Timed placement mock test.**
Aptitude + technical + GD in one timed run, scored like a real placement round.
This is what colleges actually buy.

**7. WhatsApp-first everything.**
Score cards as images (done), results forwarded to WhatsApp, maybe alerts via
WhatsApp Business API. Your audience lives there, not in email.

### Don't build

- More AI tools. You have too many for one person to maintain.
- A mobile app. The PWA path is one-tenth the work.
- Display ads. Career traffic yields almost nothing and it would cost more in
  lost Pro signups than it earns.
- Anything that competes with Naukri on job listings. You'll lose.

---

## 5. What I'd actually do, in order

**This week**
1. Reconcile the schema (`pg_dump`) — stops the recurring breakage
2. Verify `swache.in` in Resend — your payment emails currently look like spam
3. Watch CI go green; fix whatever it surfaces
4. Seed the pilot college, screenshot `/institution`

**This month**
5. Email 10 TPOs a week. This is the revenue stream that doesn't need traffic
6. Test ₹99/mo and a ₹499 term pass against ₹30
7. Company interview-question pages (~40, from data you already have)
8. Unlimited free ATS checks; tighten depth instead

**Next quarter**
9. Placement-readiness PDF; close 2–3 college pilots
10. Try-before-signup on 3 more tools
11. Expand `SEO_ROLES` 35 → 150
12. Tests on the paid paths — payments, plan gating, usage limits

---

## 6. The honest summary

The product is not short of features. It is short of **proof that the features
work**, **users who know it exists**, and **a price that makes the effort
worthwhile**.

You have already built the hard part. The next six months should be almost
entirely verification and distribution — and the college channel is the one
place where a single conversation is worth more than a thousand consumer
signups.

One caution worth repeating: this is a product for people in a stressful,
rejection-heavy period of their lives. Every decision you make about
gamification, urgency, upsells and email frequency should be weighed against
that. The restraint is not only ethical — a tool that adds guilt to a job hunt
gets deleted, and the one that feels like it's on your side gets recommended
to the whole batch.
