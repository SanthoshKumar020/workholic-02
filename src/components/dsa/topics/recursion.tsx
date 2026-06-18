"use client";

import type { Step, StructureViewProps, TopicModule } from "@/lib/dsa/types";
import { cn } from "@/lib/utils";

interface StackState {
  frames: string[];
  caption?: string;
}

function CallStackView({ state, highlight }: StructureViewProps) {
  const s = state as StackState;
  const active = new Set(highlight.active ?? []);
  const frames = s.frames;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">call stack (newest on top)</span>
      <div className="flex w-full max-w-xs flex-col gap-1.5">
        {frames.length === 0 ? (
          <span className="rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-center text-sm text-slate-400">
            stack empty
          </span>
        ) : (
          frames
            .map((f, i) => ({ f, i }))
            .reverse()
            .map(({ f, i }) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl border-2 px-3 py-2 text-center text-sm font-bold transition-all",
                  active.has(i) ? "border-violet-500 bg-violet-100 text-violet-800 ring-2 ring-violet-200" : "border-slate-200 bg-white text-slate-500",
                )}
                style={{ marginLeft: i * 14, marginRight: i * 14 }}
              >
                {f}
              </div>
            ))
        )}
      </div>
      {s.caption && <p className="text-sm font-bold text-slate-600">{s.caption}</p>}
    </div>
  );
}

const CODE = [
  "def factorial(n):",
  "    if n == 1:            # base case — stop here",
  "        return 1",
  "    return n * factorial(n - 1)   # call itself, smaller",
];

function buildFactorial(): Step[] {
  const frames: string[] = [];
  const snap = (extra: Partial<StackState> = {}): StackState => ({ frames: [...frames], ...extra });
  const steps: Step[] = [
    { state: snap({ caption: "compute factorial(4)" }), highlight: {}, codeLine: 0, action: "start", narration: "Recursion: a function that calls <b>itself</b> on a smaller problem until it hits a base case.", kidNarration: "Like nesting dolls — open a smaller one each time!" },
  ];
  // Descend.
  for (let n = 4; n >= 1; n--) {
    frames.push(`factorial(${n})`);
    const base = n === 1;
    steps.push({
      state: snap({ caption: base ? "base case reached!" : `factorial(${n}) waits for factorial(${n - 1})` }),
      highlight: { active: [frames.length - 1] },
      codeLine: base ? 2 : 3,
      action: "call",
      narration: base ? "factorial(1) hits the <b>base case</b> and returns <b>1</b> — no more calls." : `factorial(${n}) can't finish yet — it calls factorial(${n - 1}) and waits.`,
      kidNarration: base ? "The tiniest doll — it just says 1!" : `Open doll ${n}…`,
    });
  }
  // Unwind.
  let result = 1;
  for (let n = 1; n <= 4; n++) {
    result = n === 1 ? 1 : n * result;
    frames.pop();
    steps.push({
      state: snap({ caption: `factorial(${n}) = ${result}` }),
      highlight: { active: frames.length ? [frames.length - 1] : [] },
      codeLine: n === 1 ? 2 : 3,
      action: "return",
      narration: `factorial(${n}) returns <b>${result}</b> to its caller${frames.length ? "" : " — the stack is empty"}.`,
      kidNarration: `Close doll ${n}: it's ${result}!`,
    });
  }
  steps.push({ state: snap({ caption: "answer: 24" }), highlight: {}, codeLine: 0, action: "done", narration: "Each call resolved in reverse order: 1 → 2 → 6 → <b>24</b>. That stack of waiting calls is the recursion.", kidNarration: "All the dolls closed back up: 24! 🎉" });
  return steps;
}

export const recursionModule: TopicModule = {
  slug: "recursion",
  StructureView: CallStackView,
  demos: [{ key: "factorial", label: "factorial(4)", emoji: "🪆", pythonCode: CODE, buildSteps: buildFactorial }],
  lesson: {
    story: [
      "Have you seen <b>Russian nesting dolls</b>? 🪆 Open one and there's a smaller one inside.",
      "You keep opening until you reach the tiniest doll that doesn't open — that's the <b>base case</b>.",
      "Then you close them back up, one by one, in reverse order.",
      "Recursion is a function that calls itself on a smaller version, until the base case stops it.",
      "…and grown-ups call this <b>Recursion</b>!",
    ],
    steps: [
      "Every recursion needs a BASE CASE that returns without calling again.",
      "Each call shrinks the problem and waits on the call stack for the smaller answer.",
      "Answers resolve back up in reverse order (last call returns first).",
    ],
    complexity: { time: "depends on the recurrence (factorial here is O(n))", space: "O(depth) for the call stack", note: "Too-deep recursion overflows the stack." },
    edgeCases: [
      "Forgetting the base case → infinite recursion → stack overflow.",
      "Deep recursion can exceed the stack limit — consider an iterative version.",
      "Overlapping subproblems? Add memoisation (that's dynamic programming).",
    ],
    interviewTips: [
      "State the base case and the recursive case explicitly.",
      "Trees, DFS, divide-and-conquer (merge sort), and backtracking are all recursion.",
      "Recursion + memoisation = top-down dynamic programming.",
      "Know how to convert recursion to iteration with an explicit stack.",
    ],
  },
  recall: [
    { question: "Every recursive function must have a…", answer: "base case", options: ["base case", "loop"], explain: "The base case stops the calls — without it you recurse forever." },
    { question: "Recursive calls wait on the…", answer: "call stack", options: ["call stack", "heap"], explain: "Each pending call sits on the stack until the smaller one returns." },
    { question: "Recursion with no base case causes a stack overflow.", answer: true, explain: "Calls pile up endlessly until the stack runs out." },
  ],
};
