"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { BitSays } from "@/components/dsa/Mascot";
import { Confetti } from "@/components/dsa/Confetti";
import { cn } from "@/lib/utils";

interface Plate {
  id: number;
  emoji: string;
  label: string;
}

const TRAY: { emoji: string; label: string }[] = [
  { emoji: "🍕", label: "Pizza" },
  { emoji: "🥗", label: "Salad" },
  { emoji: "🍰", label: "Cake" },
  { emoji: "🍔", label: "Burger" },
  { emoji: "🍩", label: "Donut" },
];

// Build Bit's snack: bottom → top.
const TARGET = ["🍕", "🥗", "🍰"];

/**
 * TRY IT mini-game for Stacks. The learner pushes plates from a tray and pops
 * the top plate to match Bit's order — learning LIFO by doing it themselves.
 */
export function PlateStacker({ onWin }: { onWin?: (stars: number) => void }) {
  const [stack, setStack] = useState<Plate[]>([]);
  const [moves, setMoves] = useState(0);
  const [nextId, setNextId] = useState(1);
  const [msg, setMsg] = useState("Tap a plate to put it on top of the pile!");
  const [mood, setMood] = useState<"happy" | "cheer" | "oops">("happy");
  const [won, setWon] = useState(false);

  const matches = useMemo(
    () => stack.length === TARGET.length && stack.every((p, i) => p.emoji === TARGET[i]),
    [stack],
  );

  function checkWin(next: Plate[], usedMoves: number) {
    const ok = next.length === TARGET.length && next.every((p, i) => p.emoji === TARGET[i]);
    if (ok && !won) {
      setWon(true);
      setMood("cheer");
      setMsg("You built it perfectly! 🎉");
      // 3 stars if solved in the minimum 3 moves, scaling down with wasted moves.
      const stars = usedMoves <= 3 ? 3 : usedMoves <= 5 ? 2 : 1;
      onWin?.(stars);
    }
  }

  function push(item: { emoji: string; label: string }) {
    if (won) return;
    const next = [...stack, { ...item, id: nextId }];
    setStack(next);
    setNextId((n) => n + 1);
    const m = moves + 1;
    setMoves(m);
    setMood("happy");
    setMsg(`Put ${item.label} on top. The top is what comes off first!`);
    checkWin(next, m);
  }

  function pop() {
    if (won) return;
    if (stack.length === 0) {
      setMood("oops");
      setMsg("Almost! The pile is empty — there's nothing to take off yet 🙂");
      return;
    }
    const top = stack[stack.length - 1];
    const next = stack.slice(0, -1);
    setStack(next);
    const m = moves + 1;
    setMoves(m);
    setMood("happy");
    setMsg(`Took ${top.label} off the top (LIFO!).`);
  }

  function reset() {
    setStack([]);
    setMoves(0);
    setWon(false);
    setMood("happy");
    setMsg("Fresh pile! Tap a plate to start.");
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-brand-50/40 p-5">
      <Confetti fire={won} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-700">
          🎯 Build Bit&apos;s snack (bottom → top):{" "}
          <span className="text-lg">{TARGET.join(" ")}</span>
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* The pile */}
        <div className="flex min-h-[200px] flex-col-reverse items-center justify-end gap-1.5 rounded-2xl bg-white/70 p-4">
          <div className="h-3 w-40 rounded-b-xl bg-slate-300" />
          {stack.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex h-11 w-40 items-center justify-center gap-2 rounded-full border-b-4 text-sm font-bold shadow-sm transition-all",
                i === stack.length - 1
                  ? "border-fuchsia-500 bg-fuchsia-100 text-fuchsia-800 ring-2 ring-fuchsia-300"
                  : "border-violet-300 bg-white text-slate-700",
              )}
            >
              <span className="text-lg">{p.emoji}</span> {p.label}
            </div>
          ))}
          {stack.length === 0 && (
            <span className="mb-auto rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-xs font-medium text-slate-400">
              empty pile
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tap to push a plate</p>
          <div className="flex flex-wrap gap-2">
            {TRAY.map((t) => (
              <button
                key={t.label}
                onClick={() => push(t)}
                disabled={won}
                className="flex flex-col items-center rounded-2xl border-2 border-violet-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 disabled:opacity-40"
              >
                <span className="text-2xl">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={pop}
            disabled={won}
            className="mt-1 rounded-2xl bg-fuchsia-500 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-fuchsia-600 active:scale-95 disabled:opacity-40"
          >
            ⬆️ Take the top plate (pop)
          </button>
          <p className="text-center text-xs font-semibold text-slate-400">Moves: {moves}</p>
        </div>
      </div>

      <div className="mt-4">
        <BitSays mood={mood}>
          {msg}
          {matches && won && <span className="ml-1 font-bold text-emerald-600">You&apos;re a Stack Master! 🏆</span>}
        </BitSays>
      </div>
    </div>
  );
}
