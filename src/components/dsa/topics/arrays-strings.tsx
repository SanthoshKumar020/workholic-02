"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const A = (values: (number | string)[], extra: Partial<ArrayState> = {}): ArrayState => ({
  values,
  variant: "boxes",
  ...extra,
});

const ACCESS_CODE = ["arr = [5, 8, 2, 9, 1, 7]", "", "x = arr[3]   # jump to index 3", "print(x)     # 9"];
const SEARCH_CODE = [
  "def search(arr, target):",
  "    for i in range(len(arr)):",
  "        if arr[i] == target:",
  "            return i      # found it!",
  "    return -1             # not here",
];
const INSERT_CODE = [
  "def insert(arr, i, val):",
  "    arr.append(None)",
  "    for k in range(len(arr)-1, i, -1):",
  "        arr[k] = arr[k-1]   # shift right",
  "    arr[i] = val            # drop it in",
  "    return arr",
];

function buildAccess(): Step[] {
  const v = [5, 8, 2, 9, 1, 7];
  return [
    { state: A(v), highlight: {}, codeLine: 0, action: "start", narration: "An array is a row of numbered boxes (indices start at 0).", kidNarration: "A row of numbered lockers!" },
    { state: A(v, { pointers: { i: 3 } }), highlight: { active: [3] }, codeLine: 2, action: "access", narration: "arr[3] jumps straight to box 3 — its value is <b>9</b>. One step, <b>O(1)</b>.", kidNarration: "Locker 3 holds a 9!" },
    { state: A(v, { pointers: { i: 3 }, caption: "arr[3] = 9" }), highlight: { placed: [3] }, codeLine: 3, action: "done", narration: "The index is the box number — that's why access is instant.", kidNarration: "We found it instantly! 🎉" },
  ];
}

function buildSearch(): Step[] {
  const v = [5, 8, 2, 9, 1, 7];
  const target = 1;
  const steps: Step[] = [
    { state: A(v, { caption: `looking for ${target}` }), highlight: {}, codeLine: 0, action: "start", narration: `There's no index for the <b>value</b> ${target}, so we must look box by box.`, kidNarration: `Let's hunt for the ${target}!` },
  ];
  for (let i = 0; i < v.length; i++) {
    const found = v[i] === target;
    steps.push({
      state: A(v, { pointers: { i }, caption: found ? `found at index ${i}` : `looking for ${target}` }),
      highlight: found ? { placed: [i] } : { compare: [i], visited: Array.from({ length: i }, (_, k) => k) },
      codeLine: found ? 3 : 2,
      action: found ? "done" : "compare",
      narration: found ? `Found <b>${target}</b> at index ${i}! Searching by value is <b>O(n)</b>.` : `Is box ${i} (${v[i]}) equal to ${target}? No, keep going.`,
      kidNarration: found ? `Found it at locker ${i}! 🎉` : `Locker ${i} isn't it…`,
    });
    if (found) break;
  }
  return steps;
}

function buildInsert(): Step[] {
  const base = [5, 8, 2, 9, 1];
  const at = 2;
  const val = 6;
  const steps: Step[] = [
    { state: A(base), highlight: {}, codeLine: 0, action: "start", narration: `Insert <b>${val}</b> at index ${at}. Everything from index ${at} must shift right first.`, kidNarration: `Squeeze a ${val} into spot ${at} — everyone shuffles over!` },
  ];
  const work = [...base, base[base.length - 1]]; // grow by one (duplicate last as placeholder)
  for (let k = work.length - 1; k > at; k--) {
    work[k] = work[k - 1];
    steps.push({
      state: A([...work], { pointers: { k } }),
      highlight: { swap: [k], active: [k - 1] },
      codeLine: 3,
      action: "insert",
      narration: `Shift the value from index ${k - 1} into index ${k}.`,
      kidNarration: `Slide it over to spot ${k}.`,
    });
  }
  work[at] = val;
  steps.push({ state: A([...work], { pointers: { i: at }, caption: `inserted ${val} at ${at}` }), highlight: { placed: [at] }, codeLine: 4, action: "done", narration: `Drop ${val} into index ${at}. Inserting in the middle is <b>O(n)</b> because of the shifting.`, kidNarration: `${val} is in! Shuffling makes this slower than a jump. 🎉` });
  return steps;
}

export const arraysStringsModule: TopicModule = {
  slug: "arrays-strings",
  StructureView: ArrayView,
  demos: [
    { key: "access", label: "Access (O(1))", emoji: "⚡", pythonCode: ACCESS_CODE, buildSteps: buildAccess },
    { key: "search", label: "Search (O(n))", emoji: "🔎", pythonCode: SEARCH_CODE, buildSteps: buildSearch },
    { key: "insert", label: "Insert (shift)", emoji: "➕", pythonCode: INSERT_CODE, buildSteps: buildInsert },
  ],
  lesson: {
    story: [
      "Picture a long row of school lockers, each with a number on it. 🔢",
      "If you know the locker number, you walk <b>straight</b> to it — no searching.",
      "But to find <b>which</b> locker holds your red bag, you might have to peek inside each one.",
      "And to squeeze a new locker into the middle, everyone after it has to shuffle down.",
      "…and grown-ups call this an <b>Array</b> (a String is just an array of letters)!",
    ],
    steps: [
      "Access by index: O(1) — jump straight there.",
      "Search by value: O(n) — you may scan everything.",
      "Insert/delete in the middle: O(n) — items must shift to make room.",
    ],
    complexity: { time: "access O(1), search O(n), insert/delete O(n)", space: "O(n)", note: "Contiguous memory is what makes indexing instant." },
    edgeCases: [
      "Index out of range → error. Valid indices are 0 … len-1.",
      "Strings are usually immutable — 'editing' builds a new string.",
      "Appending to the end is O(1) amortised; inserting at the front is O(n).",
    ],
    interviewTips: [
      "Indexing is your O(1) superpower — use it.",
      "Need fast lookups by value, not index? Reach for a hash map.",
      "Watch off-by-one errors at the boundaries (0 and len-1).",
      "Two-pointer and sliding-window tricks turn many O(n²) array problems into O(n).",
    ],
  },
  recall: [
    { question: "Reading arr[i] when you know i is…", answer: "O(1)", options: ["O(1)", "O(n)"], explain: "The index is the box number — instant access." },
    { question: "Arrays store their items right next to each other in memory.", answer: true, explain: "That contiguous layout is exactly why indexing is O(1)." },
    { question: "Inserting at the FRONT of an array is…", answer: "O(n)", options: ["O(1)", "O(n)"], explain: "Every other item must shift over to make room." },
  ],
};
