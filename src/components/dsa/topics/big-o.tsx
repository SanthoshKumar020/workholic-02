"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const A = (values: (number | string)[], extra: Partial<ArrayState> = {}): ArrayState => ({
  values,
  variant: "boxes",
  ...extra,
});

const O1_CODE = ["def get(arr, i):", "    return arr[i]   # one jump — any size!"];
const ON_CODE = ["def count(arr):", "    total = 0", "    for x in arr:      # touch each once", "        total += 1", "    return total"];
const ON2_CODE = [
  "def has_dup(arr):",
  "    for i in range(len(arr)):",
  "        for j in range(len(arr)):",
  "            if i != j and arr[i] == arr[j]:",
  "                return True   # compared every pair",
  "    return False",
];

function buildO1(): Step[] {
  const v = [10, 20, 30, 40, 50, 60];
  return [
    { state: A(v), highlight: {}, codeLine: 0, action: "start", narration: "We want the item at index 3.", kidNarration: "We want locker number 3." },
    {
      state: A(v, { pointers: { i: 3 } }),
      highlight: { active: [3] },
      codeLine: 1,
      action: "access",
      narration: "Jump <b>straight</b> to index 3 — one step, no matter how big the array is. That's <b>O(1)</b>.",
      kidNarration: "We go straight to locker 3 in one step!",
    },
    { state: A(v, { pointers: { i: 3 }, caption: "1 step → O(1)" }), highlight: { placed: [3] }, codeLine: 1, action: "done", narration: "Constant time: 6 items or 6 million, still one jump.", kidNarration: "Same speed even with a million lockers! 🎉" },
  ];
}

function buildOn(): Step[] {
  const v = [3, 7, 1, 9, 4];
  const steps: Step[] = [
    { state: A(v, { caption: "total = 0" }), highlight: {}, codeLine: 1, action: "start", narration: "To <b>count</b> them, we must look at each one.", kidNarration: "Let's count every candy, one by one." },
  ];
  for (let i = 0; i < v.length; i++) {
    steps.push({
      state: A(v, { pointers: { x: i }, caption: `total = ${i + 1}` }),
      highlight: { active: [i], visited: Array.from({ length: i }, (_, k) => k) },
      codeLine: 3,
      action: "visit",
      narration: `Count item ${i + 1}. We touch <b>every</b> element exactly once.`,
      kidNarration: `That's ${i + 1}!`,
    });
  }
  steps.push({ state: A(v, { caption: "total = 5 → O(n)" }), highlight: { placed: v.map((_, i) => i) }, codeLine: 4, action: "done", narration: "We did n steps for n items — <b>O(n)</b>. Double the items, double the work.", kidNarration: "More candy = more counting. That's O(n)! 🎉" });
  return steps;
}

function buildOn2(): Step[] {
  const v = [4, 2, 7, 2];
  const steps: Step[] = [
    { state: A(v), highlight: {}, codeLine: 0, action: "start", narration: "To check for a duplicate the slow way, compare <b>every pair</b>.", kidNarration: "Let's compare every candy with every other candy." },
  ];
  let count = 0;
  for (let i = 0; i < v.length; i++) {
    for (let j = 0; j < v.length; j++) {
      if (i === j) continue;
      count++;
      steps.push({
        state: A(v, { pointers: { i, j }, caption: `${count} comparisons` }),
        highlight: { active: [i], compare: [j] },
        codeLine: 3,
        action: "compare",
        narration: `Compare index ${i} with index ${j}.`,
        kidNarration: `Compare these two.`,
      });
    }
  }
  steps.push({ state: A(v, { caption: `${count} comparisons → O(n²)` }), highlight: {}, codeLine: 5, action: "done", narration: `For ${v.length} items we made ${count} comparisons. That's roughly n×n — <b>O(n²)</b>. Double the items → <b>4×</b> the work!`, kidNarration: "Comparing everything with everything is super slow — O(n²)!" });
  return steps;
}

export const bigOModule: TopicModule = {
  slug: "big-o",
  StructureView: ArrayView,
  demos: [
    { key: "o1", label: "O(1) — one jump", emoji: "⚡", pythonCode: O1_CODE, buildSteps: buildO1 },
    { key: "on", label: "O(n) — count all", emoji: "🚶", pythonCode: ON_CODE, buildSteps: buildOn },
    { key: "on2", label: "O(n²) — every pair", emoji: "🐌", pythonCode: ON2_CODE, buildSteps: buildOn2 },
  ],
  lesson: {
    story: [
      "Imagine a big bag of candy. 🍬",
      "If I say “grab the candy on top”, that takes the same time whether the bag holds 10 pieces or 10,000 — just one grab!",
      "But if I say “count them ALL”, a bigger bag means more counting. Twice the candy, twice the time.",
      "Big-O is just a way to say <b>how the work grows</b> as the input gets bigger.",
      "…and grown-ups call this <b>Big-O notation</b>!",
    ],
    steps: [
      "O(1): same time no matter the size — like grabbing the top candy.",
      "O(n): time grows in step with the size — like counting each candy once.",
      "O(n²): time grows much faster — like comparing every candy with every other candy.",
    ],
    complexity: {
      time: "O(1) < O(log n) < O(n) < O(n log n) < O(n²)",
      space: "measured the same way (extra memory used)",
      note: "Lower growth = scales better as data grows.",
    },
    edgeCases: [
      "Drop constants: O(2n) → O(n).",
      "Keep only the biggest term: O(n² + n) → O(n²).",
      "Big-O describes the worst case as n grows to infinity.",
    ],
    interviewTips: [
      "Always state BOTH time and space complexity.",
      "Memorise the ladder: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ).",
      "Nested loops over the same data usually mean O(n²).",
      "Halving the problem each step (binary search) means O(log n).",
    ],
  },
  recall: [
    { question: "Looking up arr[5] by its index is…", answer: "O(1)", options: ["O(1)", "O(n)"], explain: "Arrays jump straight to an index — constant time." },
    { question: "Two nested loops over n items is usually…", answer: "O(n²)", options: ["O(n)", "O(n²)"], explain: "Each item pairs with every item → n × n." },
    { question: "O(2n) simplifies to O(n).", answer: true, explain: "Big-O drops constant factors like the 2." },
  ],
};
