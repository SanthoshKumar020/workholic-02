"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const A = (values: (number | string)[], extra: Partial<ArrayState> = {}): ArrayState => ({
  values,
  variant: "boxes",
  ...extra,
});

const REVERSE_CODE = [
  "def reverse(arr):",
  "    l, r = 0, len(arr) - 1",
  "    while l < r:",
  "        arr[l], arr[r] = arr[r], arr[l]",
  "        l += 1",
  "        r -= 1",
  "    return arr",
];
const PAIR_CODE = [
  "def pair_sum(arr, target):   # arr is sorted",
  "    l, r = 0, len(arr) - 1",
  "    while l < r:",
  "        s = arr[l] + arr[r]",
  "        if s == target: return (l, r)",
  "        if s < target:  l += 1   # need bigger",
  "        else:           r -= 1   # need smaller",
  "    return None",
];

function buildReverse(): Step[] {
  const v = [1, 2, 3, 4, 5];
  const steps: Step[] = [
    { state: A(v, { pointers: { l: 0, r: v.length - 1 } }), highlight: {}, codeLine: 1, action: "start", narration: "Put one pointer at each <b>end</b>. We'll swap and walk inward.", kidNarration: "Two friends start at opposite ends!" },
  ];
  let l = 0,
    r = v.length - 1;
  while (l < r) {
    steps.push({ state: A([...v], { pointers: { l, r } }), highlight: { swap: [l, r] }, codeLine: 3, action: "swap", narration: `Swap index ${l} and index ${r}.`, kidNarration: "Trade places!" });
    [v[l], v[r]] = [v[r], v[l]];
    l++;
    r--;
    steps.push({ state: A([...v], { pointers: { l, r } }), highlight: { placed: [l - 1, r + 1] }, codeLine: 4, action: "move", narration: "Step both pointers toward the middle.", kidNarration: "Both friends step inward." });
  }
  steps.push({ state: A([...v], { caption: "reversed!" }), highlight: { placed: v.map((_, i) => i) }, codeLine: 6, action: "done", narration: "Pointers met in the middle — reversed in <b>O(n)</b> with <b>O(1)</b> extra space.", kidNarration: "All flipped around! 🎉" });
  return steps;
}

function buildPairSum(): Step[] {
  const v = [1, 3, 4, 6, 8, 11];
  const target = 10;
  const steps: Step[] = [
    { state: A(v, { pointers: { l: 0, r: v.length - 1 }, caption: `target = ${target}` }), highlight: {}, codeLine: 1, action: "start", narration: `The array is <b>sorted</b>. Look for two numbers that add to ${target}.`, kidNarration: `Find two numbers that make ${target}!` },
  ];
  let l = 0,
    r = v.length - 1;
  while (l < r) {
    const s = v[l] + v[r];
    steps.push({
      state: A(v, { pointers: { l, r }, caption: `${v[l]} + ${v[r]} = ${s}` }),
      highlight: s === target ? { placed: [l, r] } : { compare: [l, r] },
      codeLine: s === target ? 4 : 3,
      action: s === target ? "done" : "compare",
      narration:
        s === target
          ? `<b>${v[l]} + ${v[r]} = ${target}</b> ✅ Found the pair at indices ${l} and ${r}.`
          : s < target
            ? `${s} is too small — move the <b>left</b> pointer right to grow the sum.`
            : `${s} is too big — move the <b>right</b> pointer left to shrink the sum.`,
      kidNarration: s === target ? "That's the pair! 🎉" : s < target ? "Too small — slide left up." : "Too big — slide right down.",
    });
    if (s === target) break;
    if (s < target) l++;
    else r--;
  }
  return steps;
}

export const twoPointersModule: TopicModule = {
  slug: "two-pointers",
  StructureView: ArrayView,
  demos: [
    { key: "reverse", label: "Reverse in place", emoji: "🔁", pythonCode: REVERSE_CODE, buildSteps: buildReverse },
    { key: "pair", label: "Pair sum (sorted)", emoji: "🎯", pythonCode: PAIR_CODE, buildSteps: buildPairSum },
  ],
  lesson: {
    story: [
      "Two friends stand at <b>opposite ends</b> of a line of numbers. 🧍↔️🧍",
      "They walk toward each other, and at each step they check the numbers they're standing on.",
      "Depending on what they see, one of them takes a step — so together they sweep the whole line just once.",
      "No nested loops, no extra lists — just two markers moving cleverly.",
      "…and grown-ups call this the <b>Two Pointers</b> technique!",
    ],
    steps: [
      "Start a pointer at each end (or one slow + one fast).",
      "Compare the values; move ONE pointer based on the result.",
      "Stop when the pointers meet. One pass = O(n), O(1) extra space.",
    ],
    complexity: { time: "O(n)", space: "O(1)", note: "Replaces many O(n²) brute-force scans." },
    edgeCases: [
      "Pair-sum needs a SORTED array (sort first if it isn't → O(n log n)).",
      "Mind the loop condition: while l < r (not l <= r) when you can't reuse an index.",
      "Empty or single-element inputs — handle before the loop.",
    ],
    interviewTips: [
      "Clues: a SORTED array, or 'pair/triplet', or 'reverse/palindrome in place'.",
      "Opposite-ends pointers: pair sum, reverse, palindrome check, container-with-most-water.",
      "Same-direction (slow/fast) pointers: remove duplicates, cycle detection.",
      "Always say WHY a pointer moves — that's the insight interviewers want.",
    ],
  },
  recall: [
    { question: "The classic two-pointer pair-sum needs the array to be…", answer: "sorted", options: ["sorted", "any order"], explain: "Sorting lets you grow or shrink the sum by moving a pointer." },
    { question: "Two pointers usually turns an O(n²) scan into…", answer: "O(n)", options: ["O(n)", "O(n²)"], explain: "Each pointer crosses the array at most once — one pass total." },
    { question: "Two pointers needs lots of extra memory.", answer: false, explain: "It's O(1) extra space — just two index variables." },
  ],
};
