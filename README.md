# ResumeBoost

AI-powered resume enhancement, free ATS scoring, clean PDF templates, job alerts, and Stripe subscriptions. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase**, **Stripe**, **Resend**, and your **n8n** automation webhooks.

> ResumeBoost helps you improve and present your resume. It does **not** guarantee interviews, offers, or employment.

---

## Tech stack

- **Next.js 14 App Router** + TypeScript + Tailwind CSS
- **Supabase** — auth (email/password + Google OAuth), Postgres, file storage
- **Stripe** — Free vs Pro subscription, Checkout, Customer Portal, webhooks
- **Resend** — transactional email
- **n8n** — all AI/automation via webhook URLs (enhance + job search)
- **@react-pdf/renderer** — client-side PDF export

---

## 1. Install

```bash
# from the project root
npm install
```

## 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key (**server only**) |
| `NEXT_PUBLIC_N8N_ENHANCE_WEBHOOK_URL` | Your n8n "enhance/ATS" workflow Production webhook URL |
| `NEXT_PUBLIC_N8N_JOBSEARCH_WEBHOOK_URL` | Your n8n "job search" workflow Production webhook URL |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys → Publishable key |
| `STRIPE_PRICE_ID` | Stripe → Products → your Pro price → Price ID (`price_…`) |
| `STRIPE_WEBHOOK_SECRET` | From the Stripe webhook you create in step 4 (`whsec_…`) |
| `RESEND_API_KEY` | Resend → API Keys |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; your Vercel URL in prod |
| `EMAIL_FROM` | A verified Resend sender, e.g. `ResumeBoost <noreply@yourdomain.com>` |

## 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates the `profiles`, `resumes`, and `job_alerts` tables, enables **RLS** with per-user policies, adds the **signup trigger** that auto-creates a profile, and creates a private `resumes` storage bucket.
3. **Auth → Providers**:
   - Enable **Email**.
   - Enable **Google**: create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), set the authorized redirect URI to
     `https://<your-project-ref>.supabase.co/auth/v1/callback`, then paste the Client ID/Secret into Supabase.
4. **Auth → URL Configuration**: set **Site URL** to your app URL (`http://localhost:3000` for dev) and add it (plus the Vercel URL) to **Redirect URLs**, including `…/auth/callback`.

## 4. Set up Stripe

1. **Products → Add product** → name it "ResumeBoost Pro", add a **recurring** price (e.g. $12/month). Copy the **Price ID** into `STRIPE_PRICE_ID`.
2. **Developers → Webhooks → Add endpoint**:
   - **Local dev:** use the Stripe CLI instead (see below).
   - **Production:** endpoint URL = `https://<your-app>.vercel.app/api/stripe/webhook`. Select events:
     `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
   - Copy the endpoint's **Signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.
3. Enable the **Customer Portal**: Stripe → Settings → Billing → Customer portal → activate.

**Testing webhooks locally with the Stripe CLI:**

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the printed whsec_… into STRIPE_WEBHOOK_SECRET, then in another terminal:
stripe trigger checkout.session.completed
```

## 5. Run locally
![1780903592642]
```bash
npm run dev
# http://localhost:3000
```

Use Stripe **test cards** (e.g. `4242 4242 4242 4242`, any future expiry/CVC) for Checkout.

---

## 6. Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **Add New → Project**, import the repo. Framework preset auto-detects **Next.js**.
3. **Project → Settings → Environment Variables** — add every key from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_N8N_ENHANCE_WEBHOOK_URL`, `NEXT_PUBLIC_N8N_JOBSEARCH_WEBHOOK_URL`
   - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`, `EMAIL_FROM`
   - `NEXT_PUBLIC_SITE_URL` = your `https://<your-app>.vercel.app` URL
4. **Deploy.**
5. **Register the Stripe webhook** for production: Stripe → Developers → Webhooks → Add endpoint →
   `https://<your-app>.vercel.app/api/stripe/webhook` with the three events listed above. Put its signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel and **redeploy**.
6. **Update Supabase Auth URLs**: add your Vercel URL to **Site URL** and **Redirect URLs** (`https://<your-app>.vercel.app/auth/callback`), and add the same redirect to your Google OAuth client.

---

## n8n webhook contracts

**Enhance / ATS** (`NEXT_PUBLIC_N8N_ENHANCE_WEBHOOK_URL`) — receives:

```json
{ "name": "…", "email": "…", "targetRole": "…", "resumeText": "…", "mode": "enhance" | "ats-check" }
```

Should respond with JSON (object, or a single-element array):

```json
{ "atsScore": 82, "enhancedResume": "…full enhanced text…", "improvements": ["tip 1", "tip 2"] }
```

**Job search** (`NEXT_PUBLIC_N8N_JOBSEARCH_WEBHOOK_URL`) — receives:

```json
{ "keywords": "…", "role": "…", "email": "…" }
```

Should respond with:

```json
{ "jobs": [ { "title": "…", "company": "…", "location": "…", "url": "…", "postedAt": "…", "description": "…" } ] }
```

The app handles slow/failing webhooks gracefully (timeouts + friendly error messages).

---

## Project structure

```
src/
  app/         # routes (pages + API route handlers)
  components/  # reusable UI + feature components
  lib/         # supabase clients, stripe, resend, n8n helper, plan gating
  pdf/         # @react-pdf templates + export
supabase/
  schema.sql   # tables, RLS policies, signup trigger, storage bucket
middleware.ts  # session refresh + protected-route redirects
```

## Security notes

- The **service-role key** is used only in server routes (`src/lib/supabase/admin.ts`) — never shipped to the browser.
- All Stripe secret-key calls and plan updates happen in server route handlers.
- **RLS** ensures every user can read/write only their own rows.
- The Stripe webhook verifies signatures with `STRIPE_WEBHOOK_SECRET` before mutating any plan.
