import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP sender for mail that should come from a real mailbox.
 *
 * ── Why SMTP alongside Resend ───────────────────────────────────────────────
 * Resend (an API sender) is the right tool for transactional volume: signup
 * confirmations, job alerts, nudges. It is the wrong tool for cold outreach.
 *
 * Cold email lands better from a real mailbox — admin@swache.in on Google
 * Workspace or Zoho already has sending history, engagement signal, and none
 * of the "bulk sender" fingerprint that spam filters are trained on. Twenty
 * emails through a freshly-verified API domain looks exactly like what gets
 * filtered.
 *
 * So: Resend for machine mail, SMTP for human mail.
 *
 * ── Credentials ─────────────────────────────────────────────────────────────
 * Set these in .env.local (and in Vercel if the app ever needs them). Nobody
 * should ever paste an SMTP password into a chat window — put it straight in
 * the env file yourself.
 *
 *   SMTP_HOST      smtp.gmail.com | smtp.zoho.in | mail.yourhost.com
 *   SMTP_PORT      587 (STARTTLS, usual) or 465 (implicit TLS)
 *   SMTP_USER      admin@swache.in
 *   SMTP_PASS      an APP PASSWORD, never your account login password
 *   SMTP_FROM      "Santhosh Kumar <admin@swache.in>"
 *
 * Google Workspace: 2-Step Verification must be on, then create an App
 * Password at myaccount.google.com/apppasswords. Your normal password will
 * not work and should never be used here.
 * Zoho: Security → App Passwords, host smtp.zoho.in, port 465.
 */

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  return {
    host,
    port,
    // 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: port === 465,
    user,
    pass,
    from: process.env.SMTP_FROM?.trim() || user,
  };
}

export function smtpConfigured(): boolean {
  return readSmtpConfig() !== null;
}

let cached: Transporter | null = null;

export function getTransport(): Transporter | null {
  if (cached) return cached;
  const cfg = readSmtpConfig();
  if (!cfg) return null;

  cached = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    // A mailbox provider will rate-limit anyway; going slowly is also just
    // better cold-email hygiene than firing everything at once.
    pool: true,
    maxConnections: 1,
    maxMessages: 20,
  });
  return cached;
}

/** Verify credentials without sending anything. */
export async function verifySmtp(): Promise<{ ok: boolean; error?: string }> {
  const t = getTransport();
  if (!t) return { ok: false, error: "SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)." };
  try {
    await t.verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "SMTP verification failed." };
  }
}

/**
 * Send one plain-text message.
 *
 * Text only, deliberately. HTML cold email carries tracking pixels and styled
 * markup that filters score against you, and a plain message from a person
 * reads as a person.
 */
export async function sendPlainMail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const cfg = readSmtpConfig();
  const t = getTransport();
  if (!cfg || !t) return { ok: false, error: "SMTP is not configured." };

  try {
    const info = await t.sendMail({
      from: cfg.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      replyTo: opts.replyTo ?? cfg.user,
    });
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed." };
  }
}
