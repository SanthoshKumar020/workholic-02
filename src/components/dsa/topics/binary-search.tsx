"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const A = (values: number[], extra: Partial<ArrayState> = {}): ArrayState => ({
  values,
  variant: "boxes",
  ...extra,
});

const CODE = [
  "def binary_search(arr, target):  # arr is sorted",
  "    lo, hi = 0, len(arr) - 1",
  "    while lo <= hi:",
  "        mid = (lo + hi) // 2",
  "        if arr[mid] == target: return mid",
  "        if arr[mid] < target:  lo = mid + 1",
  "        else:                  hi = mid - 1",
  "    return -1",
];

function buildSearch(): Step[] {
  const v = [1, 3, 5, 7, 9, 11, 13, 15];
  const target = 11;
  const steps: Step[] = [
    { state: A(v, { pointers: { low: 0, high: v.length - 1 }, caption: `find ${target}` }), highlight: {}, codeLine: 1, action: "start", narration: `The array is <b>sorted</b>. We'll guess the middle and throw away half each time.`, kidNarration: `Higher or lower? Let's guess the middle!` },
  ];
  let lo = 0,
    hi = v.length - 1;
  const eliminated = new Set<number>();
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({
      state: A(v, { pointers: { low: lo, mid, high: hi }, caption: `mid = ${v[mid]}` }),
      highlight: { active: [mid], visited: Array.from(eliminated) },
      codeLine: 3,
      action: "compare",
      narration: `Middle is index ${mid} (value ${v[mid]}). Compare with ${target}.`,
      kidNarration: `Middle guess is ${v[mid]}.`,
    });
    if (v[mid] === target) {
      steps.push({ state: A(v, { pointers: { mid }, caption: `found at index ${mid}` }), highlight: { placed: [mid], visited: Array.from(eliminated) }, codeLine: 4, action: "done", narration: `<b>${v[mid]} = ${target}</b> 🎉 Found in just a few guesses — that's <b>O(log n)</b>.`, kidNarration: `Found it! 🎉` });
      break;
    }
    if (v[mid] < target) {
      for (let k = lo; k <= mid; k++) eliminated.add(k);
      lo = mid + 1;
      steps.push({ state: A(v, { pointers: { low: lo, high: hi }, caption: `${v[mid]} < ${target} → go right` }), highlight: { visited: Array.from(eliminated) }, codeLine: 5, action: "move", narration: `${v[mid]} is too small — the answer must be to the <b>right</b>. Throw away the left half.`, kidNarration: `Too low! Look in the bigger half.` });
    } else {
      for (let k = mid; k <= hi; k++) eliminated.add(k);
      hi = mid - 1;
      steps.push({ state: A(v, { pointers: { low: lo, high: hi }, caption: `${v[mid]} > ${target} → go left` }), highlight: { visited: Array.from(eliminated) }, codeLine: 6, action: "move", narration: `${v[mid]} is too big — the answer must be to the <b>left</b>. Throw away the right half.`, kidNarration: `Too high! Look in the smaller half.` });
    }
  }
  return steps;
}

export const binarySearchModule: TopicModule = {
  slug: "binary-search",
  StructureView: ArrayView,
  demos: [{ key: "search", label: "Find a number", emoji: "🔍", pythonCode: CODE, buildSteps: buildSearch }],
  lesson: {
    story: [
      "Let's play “guess my number from 1 to 100”. 🔢",
      "You guess <b>50</b>. I say “higher!”. Now you KNOW it's 51–100 — half the numbers are gone instantly.",
      "You guess the middle again (75)… “lower!”. Half gone again.",
      "By always guessing the <b>middle</b>, you find any number in about 7 guesses instead of 100.",
      "…and grown-ups call this <b>Binary Search</b>!",
    ],
    steps: [
      "Keep a low and a high boundary; the answer is always between them.",
      "Check the middle. Equal? Done. Otherwise throw away the half that can't contain it.",
      "Repeat. Each step halves the search space → O(log n).",
    ],
    complexity: { time: "O(log n)", space: "O(1)", note: "Halving each step is what makes it logarithmic." },
    edgeCases: [
      "Only works on SORTED data.",
      "Use mid = lo + (hi - lo)//2 to avoid overflow in other languages.",
      "Loop condition lo <= hi, and move past mid (mid±1) to avoid infinite loops.",
    ],
    interviewTips: [
      "Sorted input + 'find / first / last / smallest such that' → think binary search.",
      "O(log n) is incredibly fast: 1,000,000 items in ~20 steps.",
      "You can binary-search on an ANSWER range, not just an array.",
      "Nail the boundary updates — that's where most bugs hide.",
    ],
  },
  recall: [
    { question: "Binary search only works on data that is…", answer: "sorted", options: ["sorted", "any order"], explain: "It relies on 'higher/lower' to discard a half — needs order." },
    { question: "Each step of binary search throws away…", answer: "half", options: ["half", "one item"], explain: "Halving the space each time gives O(log n)." },
    { question: "Searching 1,000,000 sorted items takes about 20 steps.", answer: true, explain: "log₂(1,000,000) ≈ 20 — the power of O(log n)." },
  ],
};
