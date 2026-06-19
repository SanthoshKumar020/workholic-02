"use client";

import type { DsaProblem, Step } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const B = (values: number[], extra: Partial<ArrayState> = {}): ArrayState => ({ values, variant: "bars", ...extra });

const BUBBLE_WALK = ["def bubble_sort(arr):", "    n = len(arr)", "    for i in range(n):", "        for j in range(n - 1 - i):", "            if arr[j] > arr[j+1]:", "                arr[j], arr[j+1] = arr[j+1], arr[j]", "    return arr"];

function bubbleSteps(): Step[] {
  const v = [5, 2, 8, 1, 4];
  const n = v.length;
  const placed = new Set<number>();
  const steps: Step[] = [{ state: B([...v]), highlight: {}, codeLine: 0, action: "start", narration: "Bubble sort: compare neighbours and swap the bigger one rightward.", kidNarration: "Bubble the big ones to the end!" }];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({ state: B([...v]), highlight: { compare: [j, j + 1], placed: Array.from(placed) }, codeLine: 4, action: "compare", narration: `Compare ${v[j]} and ${v[j + 1]}.`, kidNarration: `${v[j]} vs ${v[j + 1]}?` });
      if (v[j] > v[j + 1]) {
        [v[j], v[j + 1]] = [v[j + 1], v[j]];
        steps.push({ state: B([...v]), highlight: { swap: [j, j + 1], placed: Array.from(placed) }, codeLine: 5, action: "swap", narration: "Out of order — swap.", kidNarration: "Swap!" });
      }
    }
    placed.add(n - 1 - i);
    steps.push({ state: B([...v], { caption: `${placed.size} in place` }), highlight: { placed: Array.from(placed) }, codeLine: 2, action: "place", narration: "The largest unsorted value has bubbled to the end.", kidNarration: "Locked in! ✅" });
  }
  steps.push({ state: B([...v], { caption: "sorted!" }), highlight: { placed: v.map((_, i) => i) }, codeLine: 6, action: "done", narration: "Sorted! Bubble sort is <b>O(n²)</b>.", kidNarration: "All in order! 🎉" });
  return steps;
}

export const sortingProblems: DsaProblem[] = [
  {
    id: "sorting:bubble",
    topic: "sorting",
    title: "Bubble Sort",
    difficulty: "easy",
    statement: "Sort a list of numbers in ascending order using bubble sort (don't use the built-in sort).",
    examples: [{ input: "[5, 2, 8, 1]", output: "[1, 2, 5, 8]" }],
    approachQuiz: { prompt: "How does bubble sort work?", options: ["Swap adjacent out-of-order pairs, repeatedly", "Pick the min each time", "Split and merge"], answer: "Swap adjacent out-of-order pairs, repeatedly", explain: "Each pass 'bubbles' the largest remaining value to the end." },
    hints: ["Compare each element with its neighbour.", "Swap them if they're out of order.", "Repeat passes until no swaps are needed."],
    approach: "Repeatedly walk the list swapping adjacent out-of-order pairs. After pass i, the largest i elements are settled at the end.",
    pythonCode: ["def bubble(arr):", "    a = arr[:]", "    n = len(a)", "    for i in range(n):", "        for j in range(n - 1 - i):", "            if a[j] > a[j+1]:", "                a[j], a[j+1] = a[j+1], a[j]", "    return a"],
    complexity: { time: "O(n²)", space: "O(1)" },
    takeaway: "Bubble sort: swap adjacent pairs; biggest settles at the end each pass.",
    code: { starter: "def bubble(arr):\n    # return a sorted copy using bubble sort\n    pass", functionName: "bubble", tests: [{ args: [[5, 2, 8, 1]], expected: [1, 2, 5, 8] }, { args: [[3, 3, 1]], expected: [1, 3, 3] }, { args: [[1]], expected: [1] }] },
    walkthrough: { pythonCode: BUBBLE_WALK, StructureView: ArrayView, buildSteps: bubbleSteps },
  },
  {
    id: "sorting:selection",
    topic: "sorting",
    title: "Selection Sort",
    difficulty: "easy",
    statement: "Sort a list in ascending order using selection sort.",
    examples: [{ input: "[5, 2, 8, 1]", output: "[1, 2, 5, 8]" }],
    approachQuiz: { prompt: "Selection sort's idea?", options: ["Find the min of the rest, place it next", "Swap neighbours", "Divide and conquer"], answer: "Find the min of the rest, place it next", explain: "Each round selects the smallest remaining and moves it into place." },
    hints: ["For each position, scan the rest for the smallest value.", "Swap that smallest into the current position.", "Move on to the next position."],
    approach: "For each index i, find the minimum of the unsorted suffix and swap it into position i.",
    pythonCode: ["def selection(arr):", "    a = arr[:]", "    for i in range(len(a)):", "        m = i", "        for j in range(i + 1, len(a)):", "            if a[j] < a[m]:", "                m = j", "        a[i], a[m] = a[m], a[i]", "    return a"],
    complexity: { time: "O(n²)", space: "O(1)" },
    takeaway: "Selection sort: repeatedly pick the minimum of the rest.",
    code: { starter: "def selection(arr):\n    # return a sorted copy using selection sort\n    pass", functionName: "selection", tests: [{ args: [[5, 2, 8, 1]], expected: [1, 2, 5, 8] }, { args: [[2, 1]], expected: [1, 2] }] },
  },
  {
    id: "sorting:insertion",
    topic: "sorting",
    title: "Insertion Sort",
    difficulty: "easy",
    statement: "Sort a list in ascending order using insertion sort.",
    examples: [{ input: "[5, 2, 8, 1]", output: "[1, 2, 5, 8]" }],
    approachQuiz: { prompt: "Insertion sort is like…", options: ["Sorting cards in your hand", "Always grabbing the biggest", "Halving the list"], answer: "Sorting cards in your hand", explain: "Take each new item and slide it back into its sorted place." },
    hints: ["Keep the left part sorted.", "Take the next item as a 'key'.", "Shift bigger items right, then drop the key in."],
    approach: "Grow a sorted prefix: for each new element, shift larger elements right and insert it into the correct spot.",
    pythonCode: ["def insertion(arr):", "    a = arr[:]", "    for i in range(1, len(a)):", "        key = a[i]", "        j = i - 1", "        while j >= 0 and a[j] > key:", "            a[j+1] = a[j]", "            j -= 1", "        a[j+1] = key", "    return a"],
    complexity: { time: "O(n²), ~O(n) if nearly sorted", space: "O(1)" },
    takeaway: "Insertion sort: grow a sorted prefix by inserting each item.",
    code: { starter: "def insertion(arr):\n    # return a sorted copy using insertion sort\n    pass", functionName: "insertion", tests: [{ args: [[5, 2, 8, 1]], expected: [1, 2, 5, 8] }, { args: [[1, 2, 3]], expected: [1, 2, 3] }] },
  },
  {
    id: "sorting:is-sorted",
    topic: "sorting",
    title: "Is It Sorted?",
    difficulty: "easy",
    statement: "Return True if the list is in non-decreasing (ascending) order, else False.",
    examples: [{ input: "[1, 2, 3]", output: "true" }, { input: "[3, 1, 2]", output: "false" }],
    approachQuiz: { prompt: "Check sorted order?", options: ["Compare each item with the previous", "Sort and compare", "Binary search"], answer: "Compare each item with the previous", explain: "A single pass checking neighbours is O(n)." },
    hints: ["Walk through neighbouring pairs.", "If any item is smaller than the one before it…", "…it's not sorted."],
    approach: "Scan once; if any element is smaller than its predecessor, return False. Otherwise True.",
    pythonCode: ["def is_sorted(arr):", "    for i in range(1, len(arr)):", "        if arr[i] < arr[i-1]:", "            return False", "    return True"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Verify order in one pass — compare each item to the previous.",
    code: { starter: "def is_sorted(arr):\n    # True if ascending, else False\n    pass", functionName: "is_sorted", tests: [{ args: [[1, 2, 3]], expected: true }, { args: [[3, 1, 2]], expected: false }, { args: [[1]], expected: true }] },
  },
  {
    id: "sorting:merge",
    topic: "sorting",
    title: "Merge Two Sorted Lists",
    difficulty: "medium",
    statement: "Given two already-sorted lists, merge them into one sorted list.",
    examples: [{ input: "[1, 3, 5], [2, 4, 6]", output: "[1, 2, 3, 4, 5, 6]" }],
    approachQuiz: { prompt: "Merge two sorted lists efficiently?", options: ["Two pointers, take the smaller front", "Concatenate then sort", "Binary search each"], answer: "Two pointers, take the smaller front", explain: "Compare the fronts and take the smaller — O(n+m). This is the heart of merge sort." },
    hints: ["Both lists are already sorted.", "Compare their front elements.", "Take the smaller one and advance that pointer."],
    approach: "Walk both lists with two pointers, always appending the smaller current element. Append any leftovers at the end.",
    pythonCode: ["def merge(a, b):", "    i = j = 0", "    out = []", "    while i < len(a) and j < len(b):", "        if a[i] <= b[j]:", "            out.append(a[i]); i += 1", "        else:", "            out.append(b[j]); j += 1", "    out.extend(a[i:])", "    out.extend(b[j:])", "    return out"],
    complexity: { time: "O(n + m)", space: "O(n + m)" },
    takeaway: "Merge sorted lists with two pointers — the core of merge sort.",
    code: { starter: "def merge(a, b):\n    # merge two sorted lists into one sorted list\n    pass", functionName: "merge", tests: [{ args: [[1, 3, 5], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6] }, { args: [[], [1]], expected: [1] }, { args: [[1, 2], []], expected: [1, 2] }] },
  },
  {
    id: "sorting:kth-smallest",
    topic: "sorting",
    title: "Kth Smallest Element",
    difficulty: "medium",
    statement: "Return the k-th smallest value in a list (k is 1-indexed).",
    examples: [{ input: "[7, 3, 1, 5], k = 2", output: "3" }],
    approachQuiz: { prompt: "Simplest correct approach?", options: ["Sort, then take index k-1", "Linear scan once", "Binary search the unsorted list"], answer: "Sort, then take index k-1", explain: "Sorting (O(n log n)) then indexing is simple and correct; a heap can do O(n log k)." },
    hints: ["If the list were sorted, where is the k-th smallest?", "Index k-1 (since k is 1-indexed).", "Sort, then index."],
    approach: "Sort the list and return the element at index k-1. (A min-heap or quickselect can do better, but this is clear and correct.)",
    pythonCode: ["def kth_smallest(arr, k):", "    return sorted(arr)[k - 1]"],
    complexity: { time: "O(n log n)", space: "O(n)" },
    takeaway: "Sorting unlocks order statistics: k-th smallest = sorted[k-1].",
    code: { starter: "def kth_smallest(arr, k):\n    # return the k-th smallest (1-indexed)\n    pass", functionName: "kth_smallest", tests: [{ args: [[7, 3, 1, 5], 2], expected: 3 }, { args: [[1], 1], expected: 1 }, { args: [[5, 4, 3, 2, 1], 5], expected: 5 }] },
  },
];
