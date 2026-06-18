"use client";

import type { Step, StructureViewProps, TopicModule } from "@/lib/dsa/types";
import { cn } from "@/lib/utils";

interface Entry {
  key: string;
  value: string;
}
interface HashState {
  buckets: Entry[][];
  incoming?: { key: string; bucket: number } | null;
  caption?: string;
}

function HashView({ state, highlight }: StructureViewProps) {
  const s = state as HashState;
  const active = new Set(highlight.active ?? []);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      {s.incoming && (
        <div className="motion-safe:animate-[dsa-fly_700ms_ease-out] rounded-xl border-2 border-fuchsia-400 bg-fuchsia-50 px-3 py-1.5 text-sm font-bold text-fuchsia-700">
          🎟️ {s.incoming.key} → bucket {s.incoming.bucket}
        </div>
      )}
      <div className="w-full max-w-sm space-y-1.5">
        {s.buckets.map((bucket, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 rounded-xl border-2 px-2 py-1.5 transition-all",
              active.has(i) ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" : "border-slate-200 bg-white",
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-white">
              {i}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {bucket.length === 0 ? (
                <span className="text-xs text-slate-300">empty</span>
              ) : (
                bucket.map((e) => (
                  <span key={e.key} className="rounded-lg bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700">
                    {e.key}: {e.value}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      {s.caption && <p className="text-sm font-bold text-slate-600">{s.caption}</p>}
      <style>{`@keyframes dsa-fly { 0% { transform: translateY(0); opacity:1 } 100% { transform: translateY(-14px); opacity:0 } }`}</style>
    </div>
  );
}

const SIZE = 5;
const hash = (s: string) => s.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0) % SIZE;

const PUT_CODE = [
  "store = [[] for _ in range(5)]",
  "def put(key, val):",
  "    i = hash(key) % 5        # which bucket?",
  "    store[i].append((key, val))",
  "def get(key):",
  "    i = hash(key) % 5        # jump straight there",
  "    for k, v in store[i]:    # scan that bucket",
  "        if k == key: return v",
  "    return None",
];

const DATA: Entry[] = [
  { key: "cat", value: "meow" },
  { key: "dog", value: "woof" },
  { key: "cow", value: "moo" },
  { key: "ant", value: "tiny" },
];

function emptyBuckets(): Entry[][] {
  return Array.from({ length: SIZE }, () => []);
}

function buildPut(): Step[] {
  const buckets = emptyBuckets();
  const snap = (extra: Partial<HashState> = {}): HashState => ({ buckets: buckets.map((b) => [...b]), ...extra });
  const steps: Step[] = [{ state: snap({ caption: `${SIZE} empty buckets` }), highlight: {}, codeLine: 0, action: "start", narration: "A hash map stores items in numbered <b>buckets</b>. A 'hash' turns each key into a bucket number.", kidNarration: "It's a coat-check with numbered hooks!" }];
  for (const e of DATA) {
    const b = hash(e.key);
    steps.push({ state: snap({ incoming: { key: e.key, bucket: b }, caption: `hash("${e.key}") → bucket ${b}` }), highlight: { active: [b] }, codeLine: 2, action: "hash", narration: `Hash the key <b>"${e.key}"</b> → bucket <b>${b}</b>.`, kidNarration: `${e.key}'s ticket says hook ${b}.` });
    const collision = buckets[b].length > 0;
    buckets[b].push(e);
    steps.push({ state: snap({ caption: collision ? `collision at ${b} → chained` : `stored in bucket ${b}` }), highlight: { active: [b] }, codeLine: 3, action: "put", narration: collision ? `Bucket ${b} was taken — just <b>chain</b> "${e.key}" alongside it.` : `Drop ("${e.key}", "${e.value}") into bucket ${b}. Average insert is <b>O(1)</b>.`, kidNarration: collision ? "Two on one hook — hang them together!" : "Hung it on the hook!" });
  }
  steps.push({ state: snap({ caption: "all stored" }), highlight: {}, codeLine: 3, action: "done", narration: "Each key landed in its bucket. Lookups will be near-instant.", kidNarration: "Everything has its hook! 🎉" });
  return steps;
}

function buildGet(): Step[] {
  const buckets = emptyBuckets();
  for (const e of DATA) buckets[hash(e.key)].push(e);
  const snap = (extra: Partial<HashState> = {}): HashState => ({ buckets: buckets.map((b) => [...b]), ...extra });
  const target = "cow";
  const b = hash(target);
  const steps: Step[] = [
    { state: snap({ caption: `get("${target}")` }), highlight: {}, codeLine: 4, action: "start", narration: `Look up <b>"${target}"</b>. We don't search every bucket…`, kidNarration: `Where's ${target}'s coat?` },
    { state: snap({ incoming: { key: target, bucket: b }, caption: `hash("${target}") → bucket ${b}` }), highlight: { active: [b] }, codeLine: 5, action: "hash", narration: `…the same hash sends us <b>straight</b> to bucket ${b}.`, kidNarration: `The ticket says hook ${b} — go right there!` },
  ];
  const bucket = buckets[b];
  bucket.forEach((e, i) => {
    const found = e.key === target;
    steps.push({ state: snap({ caption: found ? `found: ${e.value}` : `checking ${e.key}…` }), highlight: { active: [b] }, codeLine: found ? 7 : 6, action: found ? "done" : "compare", narration: found ? `Found <b>"${target}" → "${e.value}"</b>. Average lookup is <b>O(1)</b>.` : `Bucket ${b} also holds "${e.key}" — scan past it.`, kidNarration: found ? "Got it! 🎉" : `Not ${e.key}…` });
  });
  return steps;
}

export const hashMapsModule: TopicModule = {
  slug: "hash-maps",
  StructureView: HashView,
  demos: [
    { key: "put", label: "Put (store)", emoji: "📥", pythonCode: PUT_CODE, buildSteps: buildPut },
    { key: "get", label: "Get (look up)", emoji: "📤", pythonCode: PUT_CODE, buildSteps: buildGet },
  ],
  lesson: {
    story: [
      "Picture a <b>coat-check counter</b> at a theatre. 🎟️",
      "You hand over your coat and get a numbered ticket.",
      "Later you show the ticket, and the attendant goes <b>straight</b> to that hook — no searching the whole rack.",
      "A hash map does the same: a key becomes a number that points right at where the value lives.",
      "…and grown-ups call this a <b>Hash Map</b> (or dictionary)!",
    ],
    steps: [
      "A hash function turns a key into a bucket index.",
      "Store/lookup jump straight to that bucket → average O(1).",
      "Two keys can collide into one bucket — chain them and scan the short list.",
    ],
    complexity: { time: "average O(1) put/get/delete; O(n) worst case", space: "O(n)", note: "Good hashing keeps buckets short." },
    edgeCases: [
      "Collisions are normal — handle with chaining or open addressing.",
      "Keys must be hashable/immutable (e.g. strings, numbers, tuples).",
      "Hash maps don't keep insertion order guarantees in general (Python dict does since 3.7).",
    ],
    interviewTips: [
      "Reach for a hash map whenever you need fast lookup by value/key.",
      "Two Sum, group-anagrams, frequency counts — all hash-map classics.",
      "Trading O(n) space for O(1) time is a super common interview move.",
      "Mention worst-case O(n) if an adversary forces collisions.",
    ],
  },
  recall: [
    { question: "Average lookup time in a hash map is…", answer: "O(1)", options: ["O(1)", "O(n)"], explain: "The key hashes straight to its bucket — no scanning." },
    { question: "When two keys hash to the same bucket, that's called a…", answer: "collision", options: ["collision", "rotation"], explain: "Collisions are handled by chaining or probing." },
    { question: "A hash map keeps everything sorted by key.", answer: false, explain: "It's optimised for fast lookup, not order — use a tree for order." },
  ],
};
