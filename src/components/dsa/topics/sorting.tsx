"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const A = (values: number[], extra: Partial<ArrayState> = {}): ArrayState => ({
  values,
  variant: "bars",
  ...extra,
});

const START = [5, 2, 8, 1, 4, 7];

const BUBBLE_CODE = [
  "def bubble_sort(arr):",
  "    n = len(arr)",
  "    for i in range(n):",
  "        for j in range(n - 1 - i):",
  "            if arr[j] > arr[j+1]:",
  "                arr[j], arr[j+1] = arr[j+1], arr[j]",
  "    return arr",
];
const SELECTION_CODE = [
  "def selection_sort(arr):",
  "    for i in range(len(arr)):",
  "        m = i",
  "        for j in range(i + 1, len(arr)):",
  "            if arr[j] < arr[m]:",
  "                m = j",
  "        arr[i], arr[m] = arr[m], arr[i]",
  "    return arr",
];
const INSERTION_CODE = [
  "def insertion_sort(arr):",
  "    for i in range(1, len(arr)):",
  "        key = arr[i]",
  "        j = i - 1",
  "        while j >= 0 and arr[j] > key:",
  "            arr[j+1] = arr[j]",
  "            j -= 1",
  "        arr[j+1] = key",
  "    return arr",
];

function buildBubble(): Step[] {
  const v = [...START];
  const n = v.length;
  const placed = new Set<number>();
  const steps: Step[] = [{ state: A([...v]), highlight: {}, codeLine: 0, action: "start", narration: "Bubble sort: repeatedly compare <b>neighbours</b> and swap the bigger one rightward.", kidNarration: "Let's bubble the big ones to the end!" }];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({ state: A([...v], { caption: "compare neighbours" }), highlight: { compare: [j, j + 1], placed: [...placed] }, codeLine: 4, action: "compare", narration: `Compare ${v[j]} and ${v[j + 1]}.`, kidNarration: `Is ${v[j]} bigger than ${v[j + 1]}?` });
      if (v[j] > v[j + 1]) {
        [v[j], v[j + 1]] = [v[j + 1], v[j]];
        steps.push({ state: A([...v]), highlight: { swap: [j, j + 1], placed: [...placed] }, codeLine: 5, action: "swap", narration: `Swap — bigger one moves right.`, kidNarration: `Swap them!` });
      }
    }
    placed.add(n - 1 - i);
    steps.push({ state: A([...v], { caption: `${placed.size} in place` }), highlight: { placed: [...placed] }, codeLine: 3, action: "place", narration: `The largest unsorted value has bubbled to position ${n - 1 - i}.`, kidNarration: `That one's locked in! ✅` });
  }
  steps.push({ state: A([...v], { caption: "sorted!" }), highlight: { placed: v.map((_, i) => i) }, codeLine: 6, action: "done", narration: "Sorted! Bubble sort is <b>O(n²)</b> — simple but slow.", kidNarration: "All lined up shortest to tallest! 🎉" });
  return steps;
}

function buildSelection(): Step[] {
  const v = [...START];
  const n = v.length;
  const placed = new Set<number>();
  const steps: Step[] = [{ state: A([...v]), highlight: {}, codeLine: 0, action: "start", narration: "Selection sort: find the <b>smallest</b> remaining value and put it next.", kidNarration: "Find the shortest, move it to the front!" }];
  for (let i = 0; i < n; i++) {
    let m = i;
    steps.push({ state: A([...v], { caption: "looking for the min" }), highlight: { active: [m], placed: [...placed] }, codeLine: 2, action: "active", narration: `Assume index ${i} (${v[i]}) is the smallest for now.`, kidNarration: `Start with this one.` });
    for (let j = i + 1; j < n; j++) {
      steps.push({ state: A([...v]), highlight: { compare: [j], active: [m], placed: [...placed] }, codeLine: 4, action: "compare", narration: `Is ${v[j]} smaller than ${v[m]}?`, kidNarration: `Smaller?` });
      if (v[j] < v[m]) m = j;
    }
    if (m !== i) {
      [v[i], v[m]] = [v[m], v[i]];
      steps.push({ state: A([...v]), highlight: { swap: [i, m], placed: [...placed] }, codeLine: 6, action: "swap", narration: `Swap the smallest into position ${i}.`, kidNarration: `Move the shortest up!` });
    }
    placed.add(i);
  }
  steps.push({ state: A([...v], { caption: "sorted!" }), highlight: { placed: v.map((_, i) => i) }, codeLine: 7, action: "done", narration: "Sorted! Selection sort is <b>O(n²)</b> but does few swaps.", kidNarration: "Everyone in order! 🎉" });
  return steps;
}

function buildInsertion(): Step[] {
  const v = [...START];
  const n = v.length;
  const steps: Step[] = [{ state: A([...v], { caption: "index 0 is 'sorted'" }), highlight: { placed: [0] }, codeLine: 0, action: "start", narration: "Insertion sort: take each card and slide it back into its sorted place — like sorting a hand of cards.", kidNarration: "Sort your cards one at a time!" }];
  for (let i = 1; i < n; i++) {
    const key = v[i];
    steps.push({ state: A([...v], { caption: `insert ${key}` }), highlight: { active: [i], placed: Array.from({ length: i }, (_, k) => k) }, codeLine: 2, action: "active", narration: `Pick up ${key} and find where it belongs in the sorted left part.`, kidNarration: `Where does ${key} go?` });
    let j = i - 1;
    while (j >= 0 && v[j] > key) {
      v[j + 1] = v[j];
      steps.push({ state: A([...v]), highlight: { swap: [j, j + 1] }, codeLine: 5, action: "swap", narration: `${v[j]} is bigger than ${key} — shift it right.`, kidNarration: `Shuffle over.` });
      j--;
    }
    v[j + 1] = key;
    steps.push({ state: A([...v], { caption: `${i + 1} sorted` }), highlight: { placed: Array.from({ length: i + 1 }, (_, k) => k) }, codeLine: 7, action: "place", narration: `Drop ${key} into its slot. The left part stays sorted.`, kidNarration: `${key} fits right there! ✅` });
  }
  steps.push({ state: A([...v], { caption: "sorted!" }), highlight: { placed: v.map((_, i) => i) }, codeLine: 8, action: "done", narration: "Sorted! Insertion sort is <b>O(n²)</b>, but very fast on nearly-sorted data.", kidNarration: "All in order! 🎉" });
  return steps;
}

export const sortingModule: TopicModule = {
  slug: "sorting",
  StructureView: ArrayView,
  demos: [
    { key: "bubble", label: "Bubble", emoji: "🫧", pythonCode: BUBBLE_CODE, buildSteps: buildBubble },
    { key: "selection", label: "Selection", emoji: "👉", pythonCode: SELECTION_CODE, buildSteps: buildSelection },
    { key: "insertion", label: "Insertion", emoji: "🃏", pythonCode: INSERTION_CODE, buildSteps: buildInsertion },
  ],
  lesson: {
    story: [
      "Imagine lining up your friends for a photo, shortest to tallest. 🧍📏",
      "<b>Bubble</b>: keep comparing neighbours and swapping — the tallest 'bubbles' to the end each round.",
      "<b>Selection</b>: scan for the shortest person left, and walk them to the front.",
      "<b>Insertion</b>: take one friend at a time and slide them back to where they fit — like sorting cards in your hand.",
      "…and grown-ups call all of this <b>Sorting</b>!",
    ],
    steps: [
      "Bubble: swap adjacent out-of-order pairs; biggest settles at the end each pass.",
      "Selection: repeatedly pick the minimum of the rest and place it next.",
      "Insertion: grow a sorted prefix by inserting each new item into place.",
    ],
    complexity: { time: "all three: O(n²) worst case; insertion ~O(n) if nearly sorted", space: "O(1)", note: "Real libraries use O(n log n) sorts (merge/quick/Timsort)." },
    edgeCases: [
      "Already-sorted input: insertion sort is O(n); bubble can short-circuit too.",
      "Stability matters when sorting by one key but keeping another's order.",
      "For big data, prefer built-in sorted()/sort() (O(n log n)).",
    ],
    interviewTips: [
      "Know that built-in sorts are O(n log n) — mention it before hand-rolling one.",
      "Sorting first often unlocks two-pointer or greedy solutions.",
      "Insertion sort shines for small or nearly-sorted arrays.",
      "Be ready to explain stable vs unstable sorting.",
    ],
  },
  recall: [
    { question: "Bubble, selection, and insertion sort are all, in the worst case…", answer: "O(n²)", options: ["O(n²)", "O(n log n)"], explain: "These simple sorts compare ~n² pairs; library sorts are O(n log n)." },
    { question: "Insertion sort is very fast when the data is already nearly sorted.", answer: true, explain: "It barely shifts anything — close to O(n)." },
    { question: "Python's built-in sorted() runs in about…", answer: "O(n log n)", options: ["O(n log n)", "O(n²)"], explain: "It uses Timsort, an O(n log n) algorithm." },
  ],
};
