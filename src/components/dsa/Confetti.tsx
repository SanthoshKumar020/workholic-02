"use client";

import { useEffect, useState } from "react";

const COLORS = ["#6366f1", "#7c3aed", "#f59e0b", "#10b981", "#ec4899", "#22d3ee"];

/**
 * A lightweight, dependency-free confetti burst. Renders ~36 falling pieces
 * for ~1.6s then removes itself. Respects prefers-reduced-motion (renders nothing).
 */
export function Confetti({ fire }: { fire: boolean }) {
  const [pieces, setPieces] = useState<number[]>([]);

  useEffect(() => {
    if (!fire) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    setPieces(Array.from({ length: 36 }, (_, i) => i));
    const t = setTimeout(() => setPieces([]), 1700);
    return () => clearTimeout(t);
  }, [fire]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((i) => {
        const left = (i * 37) % 100;
        const delay = (i % 6) * 90;
        const duration = 1100 + ((i * 53) % 600);
        const size = 7 + (i % 4) * 3;
        const color = COLORS[i % COLORS.length];
        return (
          <span
            key={i}
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.4,
              background: color,
              animationDelay: `${delay}ms`,
              animationDuration: `${duration}ms`,
              borderRadius: i % 2 ? "2px" : "50%",
            }}
            className="absolute -top-4 block animate-[dsa-confetti_linear_forwards]"
          />
        );
      })}
      <style>{`
        @keyframes dsa-confetti {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(540deg); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
