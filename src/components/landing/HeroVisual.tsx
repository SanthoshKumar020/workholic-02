"use client";

import { useEffect, useRef } from "react";

/**
 * 3D hero visual — no WebGL, no new dependencies.
 *
 * A mouse-tracked tilting glass card showing a live ATS score ring, orbited
 * by floating tool chips, over a lightweight canvas starfield. Pure CSS 3D
 * + 2D canvas, so it stays smooth on mid-range phones.
 */

const ORBITERS = [
  { label: "Mock Interview", r: 118, t: "18s", size: "text-[11px]" },
  { label: "Job Match 94%", r: 148, t: "26s", size: "text-[11px]" },
  { label: "Cover Letter", r: 118, t: "14s", size: "text-[11px]" },
  { label: "Roadmaps", r: 148, t: "22s", size: "text-[11px]" },
];

function Starfield() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
      s: Math.random() * 0.0006 + 0.0002,
      o: Math.random() * 0.5 + 0.15,
      tw: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        st.y -= st.s;
        if (st.y < -0.02) st.y = 1.02;
        const twinkle = 0.6 + 0.4 * Math.sin(t * 0.02 + st.tw);
        ctx.beginPath();
        ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 190, 255, ${st.o * twinkle})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

export function HeroVisual() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Pointer-tracked 3D tilt (disabled on touch / reduced motion).
  useEffect(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 12}deg)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      card.style.transform = "rotateY(0deg) rotateX(0deg)";
    };
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className="perspective-1200 relative mx-auto w-full max-w-[420px]">
      <div className="absolute inset-0 -z-10">
        <Starfield />
        {/* Aurora blobs */}
        <div className="absolute -left-10 top-6 h-56 w-56 animate-aurora rounded-full bg-[#5e6ad2]/30 blur-3xl" />
        <div
          className="absolute -right-8 bottom-4 h-64 w-64 animate-aurora rounded-full bg-fuchsia-600/20 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
        {/* Orbit rings */}
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border border-white/[0.07]" />
        <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
      </div>

      {/* Orbiting chips */}
      {ORBITERS.map((o, i) => (
        <div
          key={o.label}
          className="absolute left-1/2 top-1/2 hidden animate-orbit lg:block"
          style={{ "--orbit-r": `${o.r}px`, "--orbit-t": o.t, animationDelay: `${-i * 5}s` } as React.CSSProperties}
        >
          <span className={`whitespace-nowrap rounded-full border border-white/10 bg-[#14161f]/90 px-3 py-1.5 ${o.size} font-medium text-[#d0d6e0] shadow-lg backdrop-blur`}>
            {o.label}
          </span>
        </div>
      ))}

      {/* Tilting score card */}
      <div className="preserve-3d py-10 sm:py-14">
        <div
          ref={cardRef}
          className="preserve-3d relative mx-auto w-[270px] rounded-2xl border border-white/10 bg-gradient-to-b from-[#171a26] to-[#0f1119] p-6 shadow-card-dark transition-transform duration-200 ease-out will-change-transform sm:w-[300px]"
        >
          {/* Top glow line */}
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#828fff] to-transparent" />
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#62666d]">ATS Score</p>

          {/* Animated ring */}
          <div className="relative mx-auto mt-4 h-36 w-36" style={{ transform: "translateZ(40px)" }}>
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="326.7"
                strokeDashoffset="42"
              >
                <animate attributeName="stroke-dashoffset" from="326.7" to="42" dur="1.6s" fill="freeze" calcMode="spline" keySplines="0.22 1 0.36 1" />
              </circle>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#828fff" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-semibold tracking-tight text-white">87</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">Strong</span>
            </div>
          </div>

          {/* Fix rows */}
          <div className="mt-5 space-y-2" style={{ transform: "translateZ(24px)" }}>
            {[
              { label: "Keywords", pct: "92%", w: "92%", c: "#10b981" },
              { label: "Formatting", pct: "88%", w: "88%", c: "#828fff" },
              { label: "Impact verbs", pct: "74%", w: "74%", c: "#f59e0b" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-[11px] text-[#8a8f98]">{row.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full" style={{ width: row.w, background: row.c }} />
                </div>
                <span className="w-8 text-right font-mono text-[10px] text-[#d0d6e0]">{row.pct}</span>
              </div>
            ))}
          </div>

          <div
            className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-center text-[11px] font-medium text-emerald-300"
            style={{ transform: "translateZ(24px)" }}
          >
            +3 fixes to reach 90+
          </div>
        </div>
      </div>
    </div>
  );
}
