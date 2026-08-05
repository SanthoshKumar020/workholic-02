import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HYRISE — Your complete AI career platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand colors pulled from the site palette.
const BRAND = "#5b5bf5"; // brand-600 approx
const VIOLET = "#7c3aed";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #ffffff 0%, #f3f0ff 45%, #eef2ff 100%)",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: `linear-gradient(135deg, ${BRAND}, ${VIOLET})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "30px",
              fontWeight: 800,
            }}
          >
            H
          </div>
          <div style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-1px" }}>
            HYRISE
          </div>
        </div>

        <div
          style={{
            marginTop: "48px",
            fontSize: "68px",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-2px",
            maxWidth: "1000px",
          }}
        >
          Your complete{" "}
          <span style={{ color: BRAND }}>AI career platform</span> in one place.
        </div>

        <div
          style={{
            marginTop: "28px",
            fontSize: "30px",
            color: "#475569",
            maxWidth: "960px",
          }}
        >
          Resume & ATS scoring · Mock interviews · Job matching — free to start.
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            gap: "16px",
            fontSize: "26px",
            color: "#64748b",
          }}
        >
          <span>⚡ Groq AI</span>
          <span>·</span>
          <span>🇮🇳 Built in India</span>
          <span>·</span>
          <span>₹299 / 90 days</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
