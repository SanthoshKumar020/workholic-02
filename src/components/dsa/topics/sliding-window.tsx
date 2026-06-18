"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const A = (values: number[], extra: Partial<ArrayState> = {}): ArrayState => ({
  values,
  variant: "boxes",
  ...extra,
});

const CODE = [
  "def max_sum(arr, k):",
  "    s = sum(arr[:k])          # first window",
  "    best = s",
  "    for i in range(k, len(arr)):",
  "        s += arr[i] - arr[i-k]   # slide: add new, drop old",
  "        best = max(best, s)",
  "    return best",
];

function buildMaxSum(): Step[] {
  const v = [2, 1, 5, 1, 3, 2];
  const k = 3;
  const steps: Step[] = [];

  // Build the first window.
  let s = 0;
  for (let i = 0; i < k; i++) {
    s += v[i];
    steps.push({
      state: A(v, { window: { start: 0, end: i }, caption: `sum = ${s}` }),
      highlight: { active: [i] },
      codeLine: 1,
      action: "add",
      narration: `Build the first window of size ${k}: add ${v[i]}.`,
      kidNarration: `Add ${v[i]} into the window.`,
    });
  }
  let best = s;
  steps.push({ state: A(v, { window: { start: 0, end: k - 1 }, caption: `sum = ${s}, best = ${best}` }), highlight: { compare: [0, 1, 2] }, codeLine: 2, action: "compare", narration: `First window sums to <b>${s}</b>. That's our best so far.`, kidNarration: `This window adds up to ${s}.` });

  // Slide.
  for (let i = k; i < v.length; i++) {
    const out = i - k;
    s += v[i] - v[out];
    best = Math.max(best, s);
    steps.push({
      state: A(v, { window: { start: out + 1, end: i }, caption: `sum = ${s}, best = ${best}` }),
      highlight: { active: [i], visited: [out] },
      codeLine: 4,
      action: "slide",
      narration: `Slide right: <b>add ${v[i]}</b>, <b>drop ${v[out]}</b>. No need to re-add the middle! New sum = ${s}.`,
      kidNarration: `Window slides over: +${v[i]}, −${v[out]} = ${s}.`,
    });
  }
  steps.push({ state: A(v, { caption: `answer: best = ${best}` }), highlight: {}, codeLine: 6, action: "done", narration: `Biggest window sum is <b>${best}</b>. We scanned once — <b>O(n)</b>, not O(n·k).`, kidNarration: `The best window adds up to ${best}! 🎉` });
  return steps;
}

export const slidingWindowModule: TopicModule = {
  slug: "sliding-window",
  StructureView: ArrayView,
  demos: [{ key: "maxsum", label: "Max sum of k", emoji: "🪟", pythonCode: CODE, buildSteps: buildMaxSum }],
  lesson: {
    story: [
      "Imagine looking out a <b>train window</b> as it slides along a row of seats. 🚆",
      "You always see the same number of seats at once — say 3. That's your window.",
      "As the train moves one seat, <b>one new seat appears</b> and <b>one old seat disappears</b>.",
      "So instead of recounting all 3 seats every time, you just add the new one and remove the old one.",
      "…and grown-ups call this the <b>Sliding Window</b> technique!",
    ],
    steps: [
      "Compute the first window (e.g. the sum of the first k items).",
      "Slide one step: add the entering item, subtract the leaving item.",
      "Track your answer (max/min/count) as you go. One pass = O(n).",
    ],
    complexity: { time: "O(n)", space: "O(1) for fixed windows", note: "Beats the naïve O(n·k) recompute-every-window approach." },
    edgeCases: [
      "Window bigger than the array → no valid window.",
      "Fixed-size windows are O(1) space; variable windows often need a hash map / counts.",
      "Variable windows: grow the right edge, shrink the left while a condition is broken.",
    ],
    interviewTips: [
      "Clues: 'subarray/substring', 'contiguous', 'of size k', 'longest/shortest … such that'.",
      "Fixed window: max sum of size k, averages.",
      "Variable window: longest substring without repeats, smallest subarray ≥ target.",
      "The trick is never recomputing the overlap — reuse the previous window.",
    ],
  },
  recall: [
    { question: "When the window slides one step, you…", answer: "add new, drop old", options: ["add new, drop old", "recount everything"], explain: "Reusing the overlap is what makes it O(n) instead of O(n·k)." },
    { question: "Sliding window is for CONTIGUOUS subarrays/substrings.", answer: true, explain: "The window is a continuous range — items must be next to each other." },
    { question: "'Longest substring without repeating characters' uses a…", answer: "variable window", options: ["variable window", "fixed window"], explain: "The window grows and shrinks based on a condition, so its size varies." },
  ],
};
