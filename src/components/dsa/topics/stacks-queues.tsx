"use client";

import type { Step, StructureViewProps, TopicModule } from "@/lib/dsa/types";
import { cn } from "@/lib/utils";

// ── State shape for this topic ───────────────────────────────────────────────
interface Item {
  id: number;
  emoji: string;
  label: string;
}
interface SQState {
  kind: "stack" | "queue";
  items: Item[];
  /** An item currently leaving (popped/served) — for a little fly-away animation. */
  leaving?: Item | null;
}

// ── StructureView: draws plates (stack) or an ice-cream line (queue) ──────────
export function StructureView({ state, highlight }: StructureViewProps) {
  const s = state as SQState;
  const active = new Set(highlight.active ?? []);

  if (s.kind === "stack") {
    // Top of the array = top of the stack (rendered at the top).
    const plates = [...s.items].reverse();
    return (
      <div className="flex w-full flex-col items-center gap-4">
        {s.leaving && (
          <div className="motion-safe:animate-[dsa-fly_700ms_ease-out] text-center">
            <Plate item={s.leaving} state="leaving" />
            <p className="mt-1 text-xs font-bold text-fuchsia-600">popped!</p>
          </div>
        )}
        <div className="flex flex-col items-center gap-1.5">
          {plates.length === 0 ? (
            <Empty>no plates yet</Empty>
          ) : (
            plates.map((item) => {
              const idx = s.items.indexOf(item);
              const isTop = idx === s.items.length - 1;
              return (
                <div key={item.id} className="relative">
                  {isTop && (
                    <span className="absolute -right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-bold text-fuchsia-700">
                      ← top
                    </span>
                  )}
                  <Plate item={item} state={active.has(idx) ? "active" : "rest"} />
                </div>
              );
            })
          )}
          <div className="mt-1 h-3 w-44 rounded-b-xl bg-slate-300" />
        </div>
        <StyleTag />
      </div>
    );
  }

  // Queue — front (index 0) on the left, back on the right.
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-3xl">🚚</span>
        <div className="flex items-end gap-2">
          {s.items.length === 0 ? (
            <Empty>line is empty</Empty>
          ) : (
            s.items.map((item, idx) => (
              <Cone key={item.id} item={item} state={active.has(idx) ? "active" : "rest"} />
            ))
          )}
        </div>
      </div>
      <div className="flex w-full max-w-md items-center justify-between px-10 text-[11px] font-bold text-slate-500">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">↑ front (served next)</span>
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">back (newcomers join) ↑</span>
      </div>
      {s.leaving && (
        <p className="motion-safe:animate-[dsa-fly_700ms_ease-out] text-sm font-bold text-emerald-600">
          🍦 served {s.leaving.label}!
        </p>
      )}
      <StyleTag />
    </div>
  );
}

function Plate({ item, state }: { item: Item; state: "rest" | "active" | "leaving" }) {
  return (
    <div
      className={cn(
        "flex h-12 w-44 items-center justify-center gap-2 rounded-full border-b-4 text-base font-bold shadow-sm transition-all",
        state === "active" && "scale-105 border-fuchsia-600 bg-fuchsia-100 text-fuchsia-800 ring-2 ring-fuchsia-400",
        state === "rest" && "border-violet-300 bg-white text-slate-700",
        state === "leaving" && "scale-110 border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700",
      )}
    >
      <span className="text-xl">{item.emoji}</span>
      {item.label}
    </div>
  );
}

function Cone({ item, state }: { item: Item; state: "rest" | "active" }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl px-3 py-2 transition-all",
        state === "active" ? "scale-110 bg-emerald-100 ring-2 ring-emerald-400" : "bg-white",
      )}
    >
      <span className="text-3xl">{item.emoji}</span>
      <span className="text-[11px] font-bold text-slate-600">{item.label}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 px-6 py-4 text-sm font-medium text-slate-400">
      {children}
    </div>
  );
}

function StyleTag() {
  return (
    <style>{`@keyframes dsa-fly { 0% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(-22px); opacity: 0 } }`}</style>
  );
}

// ── Python code (shown in Beginner/Interview) ────────────────────────────────
const STACK_CODE = [
  "class Stack:",
  "    def __init__(self):",
  "        self.items = []",
  "    def push(self, x):",
  "        self.items.append(x)    # put on top",
  "    def pop(self):",
  "        return self.items.pop() # take from top",
  "",
  "s = Stack()",
  's.push("Pizza")',
  's.push("Salad")',
  's.push("Cake")',
  "s.pop()   # -> Cake",
  "s.pop()   # -> Salad",
];

const QUEUE_CODE = [
  "from collections import deque",
  "",
  "q = deque()",
  "def enqueue(x):",
  "    q.append(x)        # join the back",
  "def dequeue():",
  "    return q.popleft() # serve the front",
  "",
  'enqueue("Mango")',
  'enqueue("Choco")',
  'enqueue("Vanilla")',
  "dequeue()  # -> Mango",
  "dequeue()  # -> Choco",
];

// ── Step generators ──────────────────────────────────────────────────────────
function buildStackSteps(): Step[] {
  const pizza = { id: 1, emoji: "🍕", label: "Pizza" };
  const salad = { id: 2, emoji: "🥗", label: "Salad" };
  const cake = { id: 3, emoji: "🍰", label: "Cake" };
  const S = (items: Item[], leaving?: Item | null): SQState => ({ kind: "stack", items, leaving });

  return [
    {
      state: S([]),
      highlight: {},
      codeLine: 8,
      action: "start",
      narration: "We start with an <b>empty stack</b> — like an empty plate holder.",
      kidNarration: "We start with no plates yet!",
    },
    {
      state: S([pizza]),
      highlight: { active: [0] },
      codeLine: 9,
      action: "push",
      narration: "<b>push</b> Pizza — it goes on top (and it's the only plate, so it's the bottom too).",
      kidNarration: "Pop a 🍕 Pizza plate on the pile!",
    },
    {
      state: S([pizza, salad]),
      highlight: { active: [1] },
      codeLine: 10,
      action: "push",
      narration: "<b>push</b> Salad — it lands on top of Pizza.",
      kidNarration: "Now a 🥗 Salad plate on top!",
    },
    {
      state: S([pizza, salad, cake]),
      highlight: { active: [2] },
      codeLine: 11,
      action: "push",
      narration: "<b>push</b> Cake — now Cake is on top. The pile is Pizza → Salad → Cake.",
      kidNarration: "And a 🍰 Cake plate right on top!",
      quiz: {
        prompt: "The plates are Pizza, Salad, Cake (Cake on top). Which comes off FIRST?",
        answer: "Cake",
        options: ["Pizza", "Cake"],
        hint: "You can only take the TOP plate.",
      },
    },
    {
      state: S([pizza, salad], cake),
      highlight: {},
      codeLine: 12,
      action: "pop",
      narration: "<b>pop</b> takes the <b>top</b> plate — Cake — the last one we added. That's <b>LIFO: Last In, First Out</b>.",
      kidNarration: "We take the top plate — 🍰 Cake — the one we added last!",
    },
    {
      state: S([pizza], salad),
      highlight: {},
      codeLine: 13,
      action: "pop",
      narration: "<b>pop</b> again — Salad comes off. Pizza, the first one in, is still waiting at the bottom.",
      kidNarration: "Take the next top plate — 🥗 Salad. Pizza is still at the bottom!",
    },
    {
      state: S([pizza]),
      highlight: { active: [0] },
      codeLine: 6,
      action: "done",
      narration: "Pizza was first in and would be last out. Grown-ups call this a <b>Stack</b>! 🎉",
      kidNarration: "Pizza went in first and leaves last. This pile is called a Stack! 🎉",
    },
  ];
}

function buildQueueSteps(): Step[] {
  const mango = { id: 1, emoji: "🥭", label: "Mango" };
  const choco = { id: 2, emoji: "🍫", label: "Choco" };
  const vanilla = { id: 3, emoji: "🍦", label: "Vanilla" };
  const Q = (items: Item[], leaving?: Item | null): SQState => ({ kind: "queue", items, leaving });

  return [
    {
      state: Q([]),
      highlight: {},
      codeLine: 2,
      action: "start",
      narration: "An <b>empty queue</b> — nobody is waiting at the ice-cream truck yet.",
      kidNarration: "Nobody is in line at the ice-cream truck yet!",
    },
    {
      state: Q([mango]),
      highlight: { active: [0] },
      codeLine: 8,
      action: "enqueue",
      narration: "<b>enqueue</b> Mango — Mango joins the back of the line (and is at the front).",
      kidNarration: "🥭 Mango gets in line first!",
    },
    {
      state: Q([mango, choco]),
      highlight: { active: [1] },
      codeLine: 9,
      action: "enqueue",
      narration: "<b>enqueue</b> Choco — joins the back, behind Mango.",
      kidNarration: "🍫 Choco lines up behind Mango.",
    },
    {
      state: Q([mango, choco, vanilla]),
      highlight: { active: [2] },
      codeLine: 10,
      action: "enqueue",
      narration: "<b>enqueue</b> Vanilla — at the very back now.",
      kidNarration: "🍦 Vanilla is last in line.",
      quiz: {
        prompt: "Mango, Choco, then Vanilla joined the line. Who gets served FIRST?",
        answer: "Mango",
        options: ["Mango", "Vanilla"],
        hint: "The person at the FRONT is served first.",
      },
    },
    {
      state: Q([choco, vanilla], mango),
      highlight: { active: [0] },
      codeLine: 11,
      action: "dequeue",
      narration: "<b>dequeue</b> serves the <b>front</b> — Mango, who arrived first. That's <b>FIFO: First In, First Out</b>.",
      kidNarration: "🥭 Mango was first in line, so Mango is served first!",
    },
    {
      state: Q([vanilla], choco),
      highlight: { active: [0] },
      codeLine: 12,
      action: "dequeue",
      narration: "<b>dequeue</b> again — Choco is served. Vanilla moves up to the front.",
      kidNarration: "🍫 Choco is served next. Vanilla moves up!",
    },
    {
      state: Q([vanilla]),
      highlight: { active: [0] },
      codeLine: 6,
      action: "done",
      narration: "Everyone is served in arrival order. Grown-ups call this a <b>Queue</b>! 🎉",
      kidNarration: "Everyone is served in the order they arrived. This line is called a Queue! 🎉",
    },
  ];
}

// ── The module ───────────────────────────────────────────────────────────────
export const stacksQueuesModule: TopicModule = {
  slug: "stacks-queues",
  StructureView,
  demos: [
    { key: "stack", label: "Stack (plates)", emoji: "🍽️", pythonCode: STACK_CODE, buildSteps: buildStackSteps },
    { key: "queue", label: "Queue (ice-cream line)", emoji: "🍦", pythonCode: QUEUE_CODE, buildSteps: buildQueueSteps },
  ],
  lesson: {
    story: [
      "Imagine a tall stack of plates in the kitchen. 🍽️",
      "You always add a new plate <b>on top</b> — and when you need one, you take the <b>top</b> plate too.",
      "So the <b>last</b> plate you put on is the <b>first</b> one you take off.",
      "Now picture the line at an ice-cream truck. 🍦 The person at the <b>front</b> is served first, and newcomers join the <b>back</b>.",
      "…and grown-ups call these a <b>Stack</b> (the plates) and a <b>Queue</b> (the line)!",
    ],
    steps: [
      "Stack = LIFO (Last In, First Out). push() adds to the top, pop() removes the top.",
      "Queue = FIFO (First In, First Out). enqueue() adds to the back, dequeue() removes the front.",
      "Both add and remove in O(1) — one quick move, no matter how many items are stored.",
    ],
    complexity: {
      time: "push / pop / enqueue / dequeue: O(1)",
      space: "O(n) for n items",
      note: "All core operations are constant time.",
    },
    edgeCases: [
      "Popping an empty stack → error. Check is_empty() first.",
      "Dequeuing an empty queue → error.",
      "Python list.pop(0) is O(n); use collections.deque for an O(1) queue.",
    ],
    interviewTips: [
      "Say LIFO vs FIFO out loud to show you know the difference.",
      "Stacks: undo/redo, DFS, balanced parentheses, the call stack itself.",
      "Queues: BFS, task scheduling, buffering / streaming.",
      "Use collections.deque (not a list) for a real O(1) queue.",
    ],
  },
  recall: [
    {
      question: "A stack always removes from the…",
      answer: "top",
      options: ["top", "bottom"],
      explain: "Stacks are LIFO — you push and pop from the top.",
    },
    {
      question: "In a queue, the first one in is the first one out.",
      answer: true,
      explain: "Correct! Queues are FIFO — first in, first out.",
    },
    {
      question: "Which structure powers Undo (Ctrl+Z)?",
      answer: "Stack",
      options: ["Stack", "Queue"],
      explain: "Each action is pushed on; Undo pops the most recent one off.",
    },
  ],
};
