"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Play, Pause } from "lucide-react";
import type { Deck, Slide, Theme } from "@/lib/ppt/types";
import { getTheme } from "@/lib/ppt/types";
import { cn } from "@/lib/utils";

/** Renders a single slide filling a 16:9 stage. Reused for the stage + thumbnails. */
export function SlideStage({ slide, theme, index, total }: { slide: Slide; theme: Theme; index?: number; total?: number }) {
  const dark = theme.key !== "mono";
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden p-[6%]"
      style={{ background: theme.css, color: theme.text }}
    >
      {/* accent corner */}
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[3rem]" style={{ background: theme.accent, opacity: 0.18 }} />

      {slide.layout === "title" && (
        <div className="my-auto">
          <div className="mb-4 h-1.5 w-16 rounded-full" style={{ background: theme.accent }} />
          <h1 className="text-[clamp(1.6rem,4.5vw,3.2rem)] font-extrabold leading-tight">{slide.title}</h1>
          {slide.subtitle && <p className="mt-3 text-[clamp(0.9rem,2vw,1.4rem)]" style={{ color: theme.sub }}>{slide.subtitle}</p>}
        </div>
      )}

      {slide.layout === "section" && (
        <div className="my-auto">
          {typeof index === "number" && <p className="text-[clamp(2rem,6vw,4rem)] font-black opacity-25">{String(index).padStart(2, "0")}</p>}
          <h2 className="text-[clamp(1.4rem,4vw,2.8rem)] font-extrabold">{slide.title}</h2>
          {slide.subtitle && <p className="mt-2 text-[clamp(0.85rem,1.8vw,1.2rem)]" style={{ color: theme.sub }}>{slide.subtitle}</p>}
        </div>
      )}

      {slide.layout === "bullets" && (
        <div className="flex h-full flex-col">
          <h2 className="text-[clamp(1.2rem,3.2vw,2.2rem)] font-bold">{slide.title}</h2>
          <div className="mb-4 mt-2 h-1 w-12 rounded-full" style={{ background: theme.accent }} />
          <ul className="flex flex-col justify-center gap-[2.5%] space-y-1">
            {(slide.bullets ?? []).map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-[clamp(0.8rem,1.9vw,1.3rem)] motion-safe:animate-[ppt-rise_0.5s_ease-out_both]" style={{ animationDelay: `${i * 90}ms` }}>
                <span className="mt-[0.45em] inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: theme.accent }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {slide.layout === "two-column" && (
        <div className="flex h-full flex-col">
          <h2 className="text-[clamp(1.2rem,3.2vw,2.2rem)] font-bold">{slide.title}</h2>
          <div className="mb-4 mt-2 h-1 w-12 rounded-full" style={{ background: theme.accent }} />
          <div className="grid flex-1 grid-cols-2 gap-[5%]">
            {(slide.columns ?? []).slice(0, 2).map((c, i) => (
              <div key={i} className="rounded-2xl p-[5%]" style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.05)" }}>
                <p className="mb-2 text-[clamp(0.9rem,2vw,1.3rem)] font-bold" style={{ color: theme.accent }}>{c.heading}</p>
                <ul className="space-y-1.5">
                  {c.points.map((p, j) => (
                    <li key={j} className="text-[clamp(0.72rem,1.6vw,1.05rem)]" style={{ color: theme.sub }}>• {p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.layout === "quote" && (
        <div className="my-auto">
          <p className="text-[clamp(1.5rem,5vw,3rem)] font-black leading-none" style={{ color: theme.accent }}>&ldquo;</p>
          <p className="text-[clamp(1.1rem,2.8vw,2rem)] font-semibold leading-snug">{slide.quote || slide.title}</p>
          {slide.author && <p className="mt-3 text-[clamp(0.8rem,1.6vw,1.1rem)]" style={{ color: theme.sub }}>— {slide.author}</p>}
        </div>
      )}

      {slide.layout === "stat" && (
        <div className="flex h-full flex-col">
          <h2 className="text-[clamp(1.2rem,3.2vw,2.2rem)] font-bold">{slide.title}</h2>
          <div className="grid flex-1 place-items-center">
            <div className="flex w-full flex-wrap justify-around gap-6">
              {(slide.stats ?? []).map((s, i) => (
                <div key={i} className="text-center motion-safe:animate-[ppt-rise_0.5s_ease-out_both]" style={{ animationDelay: `${i * 120}ms` }}>
                  <p className="text-[clamp(2rem,7vw,4.5rem)] font-black" style={{ color: theme.accent }}>{s.value}</p>
                  <p className="text-[clamp(0.75rem,1.6vw,1.1rem)]" style={{ color: theme.sub }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {slide.layout === "closing" && (
        <div className="my-auto text-center">
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full" style={{ background: theme.accent }} />
          <h1 className="text-[clamp(1.6rem,4.5vw,3.2rem)] font-extrabold">{slide.title}</h1>
          {slide.subtitle && <p className="mt-3 text-[clamp(0.9rem,2vw,1.3rem)]" style={{ color: theme.sub }}>{slide.subtitle}</p>}
        </div>
      )}

      {typeof index === "number" && typeof total === "number" && (
        <span className="absolute bottom-[3%] right-[4%] text-[clamp(0.6rem,1.2vw,0.85rem)] opacity-60">{index} / {total}</span>
      )}

      <style>{`@keyframes ppt-rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }`}</style>
    </div>
  );
}

export function Presenter({ deck }: { deck: Deck }) {
  const theme = getTheme(deck.theme);
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const total = deck.slides.length;

  const go = useCallback((i: number) => setCur((c) => Math.max(0, Math.min(total - 1, typeof i === "number" ? i : c))), [total]);

  useEffect(() => {
    if (!playing) return;
    if (cur >= total - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setCur((c) => c + 1), 3500);
    return () => clearTimeout(t);
  }, [playing, cur, total]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(cur + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); }
    else if (e.key.toLowerCase() === "f") fullscreen();
  };

  function fullscreen() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  const slide = deck.slides[cur];

  return (
    <div className="space-y-3">
      <div
        ref={wrapRef}
        tabIndex={0}
        onKeyDown={onKey}
        className="group relative aspect-video w-full overflow-hidden rounded-2xl shadow-lg outline-none ring-1 ring-black/10 focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        {/* keyed for enter animation on slide change */}
        <div key={cur} className="absolute inset-0 motion-safe:animate-[ppt-fade_0.4s_ease-out]">
          <SlideStage slide={slide} theme={theme} index={cur + 1} total={total} />
        </div>

        {/* click zones */}
        <button aria-label="Previous" onClick={() => go(cur - 1)} className="absolute left-0 top-0 h-full w-1/4 cursor-w-resize" />
        <button aria-label="Next" onClick={() => go(cur + 1)} className="absolute right-0 top-0 h-full w-1/4 cursor-e-resize" />

        <button onClick={fullscreen} aria-label="Fullscreen" className="absolute right-3 top-3 rounded-lg bg-black/30 p-2 text-white opacity-0 transition group-hover:opacity-100">
          <Maximize2 className="h-4 w-4" />
        </button>
        <style>{`@keyframes ppt-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
      </div>

      {/* transport */}
      <div className="flex items-center gap-2">
        <button onClick={() => go(cur - 1)} disabled={cur === 0} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => setPlaying((p) => !p)} className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-gradient px-3 text-sm font-semibold text-white">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {playing ? "Pause" : "Play"}
        </button>
        <button onClick={() => go(cur + 1)} disabled={cur >= total - 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
        <input type="range" min={0} max={total - 1} value={cur} onChange={(e) => go(Number(e.target.value))} className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500" aria-label="Slide" />
        <span className="w-14 text-right text-xs font-semibold text-slate-500">{cur + 1}/{total}</span>
      </div>

      {/* thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {deck.slides.map((s, i) => (
          <button key={i} onClick={() => go(i)} className={cn("relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg ring-2 transition", i === cur ? "ring-brand-500" : "ring-transparent hover:ring-slate-300")}>
            <div className="pointer-events-none absolute inset-0 origin-top-left" style={{ transform: "scale(0.25)", width: "400%", height: "400%" }}>
              <SlideStage slide={s} theme={theme} />
            </div>
            <span className="absolute bottom-0.5 right-1 rounded bg-black/40 px-1 text-[9px] text-white">{i + 1}</span>
          </button>
        ))}
      </div>

      {slide.notes && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <span className="font-bold text-slate-500">Speaker notes:</span> {slide.notes}
        </div>
      )}
    </div>
  );
}
