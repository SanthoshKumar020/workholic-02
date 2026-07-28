import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * Dynamic ATS score card — 1200×630 PNG.
 *
 *   /api/og/score?score=78&issues=4&name=Priya
 *
 * Two jobs:
 *  1. The OpenGraph image for /s/<id>, so a WhatsApp or LinkedIn share renders
 *     a real card instead of a bare link. In India, images get forwarded and
 *     text links get ignored — this is the whole viral loop.
 *  2. A downloadable image users can post to their status/story.
 *
 * Everything is inline styles with explicit `display: flex`, because Satori
 * (the renderer behind ImageResponse) supports only a subset of CSS.
 */

const BRAND = "#5b5bf5";
const VIOLET = "#7c3aed";

function verdict(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Strong — ATS-ready", color: "#059669" };
  if (score >= 60) return { label: "Decent — a few fixes needed", color: "#d97706" };
  return { label: "At risk — most ATS would filter this", color: "#dc2626" };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const score = Math.max(0, Math.min(100, Number(searchParams.get("score")) || 0));
  const issues = Math.max(0, Math.min(99, Number(searchParams.get("issues")) || 0));
  const name = (searchParams.get("name") || "").slice(0, 28);

  const v = verdict(score);

  // Progress ring geometry (SVG, drawn manually — Satori has no <circle> dash
  // animation support but static stroke-dasharray works fine).
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #ffffff 0%, #f3f0ff 45%, #eef2ff 100%)",
          fontFamily: "sans-serif",
          padding: "64px",
          alignItems: "center",
          gap: "56px",
        }}
      >
        {/* ── Score ring ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", position: "relative", width: "260px", height: "260px" }}>
          <svg width="260" height="260" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r={radius} stroke="#e2e8f0" strokeWidth="22" fill="none" />
            <circle
              cx="130"
              cy="130"
              r={radius}
              stroke={v.color}
              strokeWidth="22"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              transform="rotate(-90 130 130)"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "260px",
              height: "260px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "82px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: "22px", fontWeight: 600, color: "#64748b", marginTop: "4px" }}>
              out of 100
            </span>
          </div>
        </div>

        {/* ── Copy ───────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${BRAND}, ${VIOLET})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
                fontWeight: 800,
              }}
            >
              H
            </div>
            <span style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", color: "#0f172a" }}>
              HYRISE
            </span>
            <span style={{ fontSize: "20px", color: "#94a3b8" }}>ATS Resume Score</span>
          </div>

          <span
            style={{
              fontSize: "50px",
              fontWeight: 800,
              color: "#0f172a",
              marginTop: "26px",
              lineHeight: 1.12,
            }}
          >
            {name ? `${name}'s resume` : "My resume"} scored {score}/100
          </span>

          <span style={{ fontSize: "28px", fontWeight: 600, color: v.color, marginTop: "16px" }}>
            {v.label}
          </span>

          {issues > 0 && (
            <span style={{ fontSize: "24px", color: "#475569", marginTop: "10px" }}>
              {issues} fixable issue{issues !== 1 ? "s" : ""} found
            </span>
          )}

          <div
            style={{
              display: "flex",
              marginTop: "36px",
              background: `linear-gradient(135deg, ${BRAND}, ${VIOLET})`,
              color: "white",
              fontSize: "24px",
              fontWeight: 700,
              padding: "16px 28px",
              borderRadius: "14px",
              alignSelf: "flex-start",
            }}
          >
            Check yours free — hyrise.swache.in
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
