"use client";

import type { DsaProblem, Step } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const A = (values: (number | string)[], extra: Partial<ArrayState> = {}): ArrayState => ({ values, variant: "boxes", ...extra });

function findMaxSteps(): Step[] {
  const v = [3, 7, 2, 9, 4];
  let best = 0;
  const steps: Step[] = [{ state: A(v, { pointers: { best: 0, i: 0 }, caption: `best = ${v[0]}` }), highlight: { active: [0] }, codeLine: 1, action: "start", narration: "Assume the first item is the biggest so far.", kidNarration: "Start by guessing the first one is biggest." }];
  for (let i = 1; i < v.length; i++) {
    const bigger = v[i] > v[best];
    steps.push({ state: A(v, { pointers: { best, i }, caption: `${v[i]} vs best ${v[best]}` }), highlight: { compare: [i], active: [best] }, codeLine: 3, action: "compare", narration: `Is ${v[i]} bigger than the best so far (${v[best]})?`, kidNarration: `Bigger than ${v[best]}?` });
    if (bigger) {
      best = i;
      steps.push({ state: A(v, { pointers: { best, i }, caption: `new best = ${v[best]}` }), highlight: { active: [best] }, codeLine: 4, action: "update", narration: `Yes — ${v[best]} is the new best.`, kidNarration: "New biggest!" });
    }
  }
  steps.push({ state: A(v, { pointers: { best }, caption: `max = ${v[best]}` }), highlight: { placed: [best] }, codeLine: 5, action: "done", narration: `The biggest is <b>${v[best]}</b>. One pass — O(n).`, kidNarration: `The biggest is ${v[best]}! 🎉` });
  return steps;
}

export const arraysStringsProblems: DsaProblem[] = [
  {
    id: "arrays-strings:find-max",
    topic: "arrays-strings",
    title: "Find the Largest Number",
    difficulty: "easy",
    statement: "Return the largest number in a list. Don't use the built-in max().",
    examples: [{ input: "[3, 7, 2, 9, 4]", output: "9" }],
    approachQuiz: { prompt: "Best way to find the max?", options: ["One pass tracking the biggest so far", "Sort then take the last", "Check every pair"], answer: "One pass tracking the biggest so far", explain: "A single scan keeping a running 'best' is O(n) — sorting would be O(n log n)." },
    hints: ["You only need to look at each number once.", "Keep a variable for the biggest you've seen so far.", "If the current number beats it, update your 'best'."],
    approach: "Start by assuming the first element is the max. Walk through the rest; whenever you find something bigger, update your running best.",
    pythonCode: ["def find_max(arr):", "    best = arr[0]", "    for x in arr:", "        if x > best:", "            best = x", "    return best"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Find the max with one pass tracking a running best — no sorting needed.",
    code: { starter: "def find_max(arr):\n    # return the biggest number (no built-in max)\n    pass", functionName: "find_max", tests: [{ args: [[3, 7, 2, 9, 4]], expected: 9 }, { args: [[5]], expected: 5 }, { args: [[-1, -5, -2]], expected: -1 }] },
    walkthrough: { pythonCode: ["def find_max(arr):", "    best = arr[0]", "    for x in arr:", "        if x > best:", "            best = x", "    return best"], StructureView: ArrayView, buildSteps: findMaxSteps },
  },
  {
    id: "arrays-strings:sum",
    topic: "arrays-strings",
    title: "Sum of a List",
    difficulty: "easy",
    statement: "Return the sum of all numbers in a list. An empty list sums to 0.",
    examples: [{ input: "[1, 2, 3, 4]", output: "10" }],
    approachQuiz: { prompt: "How do you total a list?", options: ["Accumulate in one pass", "Sort first", "Use two pointers"], answer: "Accumulate in one pass", explain: "Keep a running total and add each element — O(n)." },
    hints: ["Keep a running total.", "Start it at 0.", "Add each element as you go."],
    approach: "Initialise a total to 0 and add each element in a single loop.",
    pythonCode: ["def total(arr):", "    s = 0", "    for x in arr:", "        s += x", "    return s"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Accumulate a running total in one pass (start at 0).",
    code: { starter: "def total(arr):\n    # return the sum of all numbers\n    pass", functionName: "total", tests: [{ args: [[1, 2, 3, 4]], expected: 10 }, { args: [[]], expected: 0 }, { args: [[-5, 5]], expected: 0 }] },
  },
  {
    id: "arrays-strings:linear-search",
    topic: "arrays-strings",
    title: "Find a Value's Index",
    difficulty: "easy",
    statement: "Return the index of the first occurrence of a target value, or -1 if it isn't present.",
    examples: [{ input: "[5, 8, 2, 9], target = 9", output: "3" }],
    approachQuiz: { prompt: "Unsorted list — how to find a value?", options: ["Linear search (check each)", "Binary search", "Two pointers"], answer: "Linear search (check each)", explain: "Without sorted order you must scan — O(n). Binary search needs sorted data." },
    hints: ["You don't know where the value is, so…", "Check each index in order.", "Return as soon as you find it; -1 if you finish without a match."],
    approach: "Loop over the indices; return the first one whose value equals the target. If the loop ends, return -1.",
    pythonCode: ["def search(arr, target):", "    for i in range(len(arr)):", "        if arr[i] == target:", "            return i", "    return -1"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Searching an unsorted list = linear scan, return the first match.",
    code: { starter: "def search(arr, target):\n    # return the index of target, or -1\n    pass", functionName: "search", tests: [{ args: [[5, 8, 2, 9], 9], expected: 3 }, { args: [[1, 2, 3], 7], expected: -1 }, { args: [[4], 4], expected: 0 }] },
  },
  {
    id: "arrays-strings:reverse-list",
    topic: "arrays-strings",
    title: "Reverse a List",
    difficulty: "easy",
    statement: "Return a new list with the elements in reverse order.",
    examples: [{ input: "[1, 2, 3]", output: "[3, 2, 1]" }],
    approachQuiz: { prompt: "Simplest correct way in Python?", options: ["Slice with a -1 step", "A nested loop", "A hash map"], answer: "Slice with a -1 step", explain: "arr[::-1] reverses cleanly; or swap from both ends in place." },
    hints: ["Python slicing can step backwards.", "arr[::-1] walks the list in reverse.", "Or use two pointers swapping from both ends."],
    approach: "Use a reverse slice arr[::-1], or swap the ends inward with two pointers if you must do it in place.",
    pythonCode: ["def reverse_list(arr):", "    return arr[::-1]"],
    complexity: { time: "O(n)", space: "O(n)" },
    takeaway: "arr[::-1] reverses a list; two pointers reverse it in place.",
    code: { starter: "def reverse_list(arr):\n    # return a reversed copy\n    pass", functionName: "reverse_list", tests: [{ args: [[1, 2, 3]], expected: [3, 2, 1] }, { args: [[1]], expected: [1] }, { args: [[]], expected: [] }] },
  },
  {
    id: "arrays-strings:count-even",
    topic: "arrays-strings",
    title: "Count the Even Numbers",
    difficulty: "easy",
    statement: "Return how many numbers in the list are even.",
    examples: [{ input: "[1, 2, 3, 4, 6]", output: "3" }],
    approachQuiz: { prompt: "How to test if a number is even?", options: ["x % 2 == 0", "x / 2 == 0", "x > 0"], answer: "x % 2 == 0", explain: "The remainder when divided by 2 is 0 for even numbers." },
    hints: ["Even means divisible by 2.", "The modulo operator % gives the remainder.", "Count the items where x % 2 == 0."],
    approach: "Loop through the list and count elements where x % 2 == 0.",
    pythonCode: ["def count_even(arr):", "    count = 0", "    for x in arr:", "        if x % 2 == 0:", "            count += 1", "    return count"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Even check is x % 2 == 0; count in one pass.",
    code: { starter: "def count_even(arr):\n    # count how many numbers are even\n    pass", functionName: "count_even", tests: [{ args: [[1, 2, 3, 4, 6]], expected: 3 }, { args: [[1, 3, 5]], expected: 0 }, { args: [[]], expected: 0 }] },
  },
  {
    id: "arrays-strings:running-sum",
    topic: "arrays-strings",
    title: "Running Sum",
    difficulty: "medium",
    statement: "Return a list where each position holds the sum of all elements up to and including it (a prefix sum).",
    examples: [{ input: "[1, 2, 3, 4]", output: "[1, 3, 6, 10]" }],
    approachQuiz: { prompt: "Best way to build prefix sums?", options: ["Accumulate as you go", "Recompute each prefix from scratch", "Sort first"], answer: "Accumulate as you go", explain: "Carry a running total and append it — O(n). Recomputing each prefix is O(n²)." },
    hints: ["Each answer is the previous answer plus the new element.", "Keep a running total.", "Append the running total at each step."],
    approach: "Carry a running total; at each element add it to the total and append the total to the output. This reuses prior work (prefix-sum pattern).",
    pythonCode: ["def running_sum(arr):", "    out = []", "    s = 0", "    for x in arr:", "        s += x", "        out.append(s)", "    return out"],
    complexity: { time: "O(n)", space: "O(n)" },
    takeaway: "Prefix sums: carry a running total and append it — don't recompute.",
    code: { starter: "def running_sum(arr):\n    # return the list of prefix sums\n    pass", functionName: "running_sum", tests: [{ args: [[1, 2, 3, 4]], expected: [1, 3, 6, 10] }, { args: [[5]], expected: [5] }, { args: [[3, -1, 2]], expected: [3, 2, 4] }] },
  },
];
