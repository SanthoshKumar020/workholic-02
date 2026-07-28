"use client";

import { useEffect, useState } from "react";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { shareText, SITE_URL, withUtm } from "@/lib/share";
import { track } from "@/lib/analytics";

/**
 * Post-result share block.
 *
 * Creates a public /s/<id> page on demand and offers three ways to spread it:
 * WhatsApp (the default in India), copy link, and download the score card as
 * an image — because images get forwarded and bare links get ignored.
 *
 * Nothing is made public until the user clicks. No resume text is ever sent.
 */
export function ShareScoreCard({
  score,
  visibleTips,
  lockedCount,
  source = "ats_result",
}: {
  score: number;
  visibleTips: string[];
  lockedCount: number;
  source?: string;
}) {
  const [name, setName] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalIssues = visibleTips.length + lockedCount;

  // Debounce the name before it reaches the image URL — otherwise every
  // keystroke would fire a fresh render of the card on the edge function.
  const [debouncedName, setDebouncedName] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(name.trim().slice(0, 28)), 500);
    return () => clearTimeout(t);
  }, [name]);

  const imageUrl = `/api/og/score?score=${score}&issues=${totalIssues}${
    debouncedName ? `&name=${encodeURIComponent(debouncedName)}` : ""
  }`;

  async function createLink() {
    if (shareUrl) return shareUrl;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          visibleTips,
          lockedCount,
          displayName: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not create a share link.");
      const url = `${SITE_URL}${data.path}`;
      setShareUrl(url);
      track("share_link_created", { source, score });
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a share link.");
      return null;
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    const url = (await createLink()) ?? shareUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(withUtm(url, "copy_link", "share", source));
      setCopied(true);
      track("share_clicked", { channel: "copy_link", source });
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Couldn't copy automatically — long-press the link to copy it.");
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-800">Share your score</p>
      <p className="mt-0.5 text-xs text-slate-500">
        Creates a public page with your score and these tips. Your resume is never shared.
      </p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={28}
        placeholder="Your first name (optional)"
        className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />

      {/* Live preview of exactly what gets forwarded. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`ATS score card showing ${score} out of 100`}
        width={1200}
        height={630}
        className="mt-3 w-full rounded-lg border border-slate-200 shadow-sm"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <WhatsAppShareButton
          text={shareText.ats(score)}
          url={shareUrl ?? SITE_URL}
          size="sm"
          source={source}
        />

        <button
          type="button"
          onClick={handleCopy}
          disabled={creating}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {creating ? "Creating…" : copied ? "✓ Link copied" : "Copy share link"}
        </button>

        <a
          href={imageUrl}
          download={`hyrise-ats-score-${score}.png`}
          onClick={() => track("share_clicked", { channel: "download_image", source })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Download image
        </a>
      </div>

      {shareUrl && (
        <p className="mt-2 break-all text-[11px] text-slate-400">
          Your page: <span className="font-medium text-slate-500">{shareUrl}</span>
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
