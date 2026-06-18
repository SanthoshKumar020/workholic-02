"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getTopicModule } from "@/components/dsa/topics/registry";
import { getIsland } from "@/lib/dsa/curriculum";
import { BitSays, Bit } from "@/components/dsa/Mascot";
import { Confetti } from "@/components/dsa/Confetti";
import { cn } from "@/lib/utils";

interface DueItem {
  item_id: string;
  item_type: string;
}
interface Card {
  itemId: string;
  topicName: string;
  question: string;
  answer: string;
  explain: string;
}

const CONFIDENCE = [
  { key: "again", label: "Forgot", emoji: "😅", quality: 1 },
  { key: "hard", label: "Tricky", emoji: "🤔", quality: 3 },
  { key: "good", label: "Knew it", emoji: "😎", quality: 4 },
  { key: "easy", label: "Easy!", emoji: "🌟", quality: 5 },
];

/** Resolve a stored SRS item_id (e.g. "stacks-queues:recall:0") to a flashcard. */
function resolve(item: DueItem): Card | null {
  const [slug, kind, idxStr] = item.item_id.split(":");
  if (kind !== "recall") return null;
  const mod = getTopicModule(slug);
  const r = mod?.recall[Number(idxStr)];
  if (!r) return null;
  const answer = typeof r.answer === "boolean" ? (r.answer ? "True" : "False") : r.answer;
  return {
    itemId: item.item_id,
    topicName: getIsland(slug)?.kidName ?? slug,
    question: r.question,
    answer,
    explain: r.explain,
  };
}

export function ReviewClient({ due }: { due: DueItem[] }) {
  const cards = useMemo(() => due.map(resolve).filter((c): c is Card => c !== null), [due]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  if (cards.length === 0 || done) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <Confetti fire={done} />
        <Bit mood="cheer" size="xl" className="mx-auto" />
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
          {done ? "All done for today! 🎉" : "Nothing to review right now! 🎉"}
        </h1>
        <p className="mt-2 text-slate-500">
          {done
            ? "Great job keeping your memory fresh. Come back tomorrow!"
            : "Master a few islands and they'll show up here when it's time to refresh them."}
        </p>
        <Link
          href="/dsa"
          className="mt-6 inline-block rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90"
        >
          Back to the map →
        </Link>
      </div>
    );
  }

  const card = cards[idx];

  async function rate(quality: number) {
    await fetch("/api/dsa/srs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: card.itemId, item_type: "recall", quality }),
    }).catch(() => {});
    if (idx + 1 < cards.length) {
      setIdx(idx + 1);
      setRevealed(false);
    } else {
      setDone(true);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-400">
        <span>Card {idx + 1} of {cards.length}</span>
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">{card.topicName}</span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xl font-bold text-slate-800">{card.question}</p>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="mt-6 rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90"
          >
            Show answer
          </button>
        ) : (
          <div className="mt-5">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-lg font-extrabold text-emerald-700">{card.answer}</p>
              <p className="mt-1 text-sm text-slate-600">{card.explain}</p>
            </div>
          </div>
        )}
      </div>

      {revealed && (
        <div className="mt-5">
          <BitSays mood="happy" className="mb-3 justify-center">
            How well did you remember it?
          </BitSays>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CONFIDENCE.map((c) => (
              <button
                key={c.key}
                onClick={() => rate(c.quality)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl border-2 border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50",
                )}
              >
                <span className="text-2xl">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
