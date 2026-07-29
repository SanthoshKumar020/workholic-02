#!/usr/bin/env node
/**
 * Send ONE outreach email over SMTP, from your real mailbox.
 *
 *   node scripts/send-outreach.mjs --to x@y.in --subject "..." --body draft.txt
 *   node scripts/send-outreach.mjs --verify
 *
 * DRY RUN BY DEFAULT. Nothing leaves your machine unless you pass --send.
 * That default is the point: every cold email should be read by a human
 * immediately before it goes, and a script that sends by default will
 * eventually send the wrong thing to the wrong person.
 *
 * One recipient per invocation, on purpose. No list mode, no CSV loop. If you
 * want to send twenty, you run this twenty times and look at twenty drafts —
 * which at twenty emails is the correct amount of friction.
 *
 * Credentials come from .env.local (SMTP_HOST / SMTP_PORT / SMTP_USER /
 * SMTP_PASS / SMTP_FROM). See src/lib/smtp.ts for provider setup notes.
 */

import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

// ── Load .env.local without a dependency ─────────────────────────────────────
const envPath = path.resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, raw] = m;
    if (process.env[k]) continue;
    process.env[k] = raw.replace(/^["']|["']$/g, "").trim();
  }
}

// ── Args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};
const has = (name) => args.includes(`--${name}`);

const host = process.env.SMTP_HOST;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const port = Number(process.env.SMTP_PORT ?? 587);
const from = process.env.SMTP_FROM || user;

const SMTP_HELP = [
  "SMTP is not configured. Add to .env.local:",
  "",
  "  SMTP_HOST=smtp.gmail.com        # or smtp.zoho.in",
  "  SMTP_PORT=587                   # 465 for Zoho / implicit TLS",
  "  SMTP_USER=admin@swache.in",
  "  SMTP_PASS=your-app-password     # App Password, NOT your login password",
  '  SMTP_FROM="Santhosh Kumar <admin@swache.in>"',
  "",
  "Google Workspace: enable 2-Step Verification, then create an App Password",
  "at https://myaccount.google.com/apppasswords",
].join("\n");

/**
 * Only loaded when we actually need to talk to a mail server.
 *
 * A dry run is just reading a file and printing it, so it must work before
 * `npm install` and before any credential exists — that's when you most want
 * to read your drafts.
 */
function getTransport() {
  if (!host || !user || !pass) {
    console.error(SMTP_HELP);
    process.exit(1);
  }
  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch {
    console.error("nodemailer is not installed. Run:  npm install");
    process.exit(1);
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// ── --verify: check credentials, send nothing ────────────────────────────────
if (has("verify")) {
  const transport = getTransport();
  try {
    await transport.verify();
    console.log(`✓ SMTP OK — ${user} via ${host}:${port}`);
    console.log(`  From header: ${from}`);
    process.exit(0);
  } catch (e) {
    console.error(`✗ SMTP failed: ${e.message}`);
    if (/username and password not accepted|invalid login|535/i.test(e.message)) {
      console.error("  Almost always: using the account password instead of an App Password.");
    }
    process.exit(1);
  }
}

// ── Send one ─────────────────────────────────────────────────────────────────
const to = flag("to");
const subject = flag("subject");
const bodyFile = flag("body");

if (!to || !subject || !bodyFile) {
  console.error(
    'Usage: node scripts/send-outreach.mjs --to "x@y.in" --subject "..." --body draft.txt [--send]\n' +
      "       node scripts/send-outreach.mjs --verify"
  );
  process.exit(1);
}
if (!existsSync(bodyFile)) {
  console.error(`Body file not found: ${bodyFile}`);
  process.exit(1);
}

const text = readFileSync(bodyFile, "utf8");
const words = text.trim().split(/\s+/).length;

console.log("─".repeat(66));
console.log(`From:    ${from ?? "(SMTP_FROM not set)"}`);
console.log(`To:      ${to}`);
console.log(`Subject: ${subject}  (${subject.length} chars)`);
console.log("─".repeat(66));
console.log(text);
console.log("─".repeat(66));
console.log(`${words} words`);

// Cheap guardrails against the two most common cold-email mistakes.
if (words > 130) console.log("⚠  Over 130 words — cold email reply rates drop sharply past ~120.");
if (subject.length > 45) console.log("⚠  Subject over 45 chars — will truncate on mobile.");
// Accepts any of the usual phrasings — the template uses "reply STOP".
if (!/\bunsubscribe\b|\bopt[- ]?out\b|reply\s+STOP|won'?t write again|not write again/i.test(text)) {
  console.log("ℹ  No opt-out line. For B2B outreach, 'reply STOP and I won't write again' turns a");
  console.log("   potential spam complaint into a clean removal. A complaint from a .edu.in domain");
  console.log("   costs far more than the prospect.");
}

if (!has("send")) {
  console.log("\nDRY RUN — nothing sent. Re-run with --send to actually send.");
  process.exit(0);
}

const transport = getTransport();
try {
  const info = await transport.sendMail({ from, to, subject, text, replyTo: user });
  console.log(`\n✓ Sent. Message ID: ${info.messageId}`);
} catch (e) {
  console.error(`\n✗ Send failed: ${e.message}`);
  process.exit(1);
}
