"use client";

import type { DsaProblem, Step } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const A = (values: number[], extra: Partial<ArrayState> = {}): ArrayState => ({ values, variant: "boxes", ...extra });

function bsearchSteps(): Step[] {
  const v = [1, 3, 5, 7, 9, 11, 13, 15];
  const target = 11;
  const steps: Step[] = [{ state: A(v, { pointers: { low: 0, high: v.length - 1 }, caption: `find ${target}` }), highlight: {}, codeLine: 1, action: "start", narration: "Sorted list — guess the middle and discard a half each time.", kidNarration: "Higher or lower? Guess the middle!" }];
  let lo = 0, hi = v.length - 1;
  const gone = new Set<number>();
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ state: A(v, { pointers: { low: lo, mid, high: hi }, caption: `mid = ${v[mid]}` }), highlight: { active: [mid], visited: Array.from(gone) }, codeLine: 3, action: "compare", narration: `Middle is ${v[mid]}. Compare with ${target}.`, kidNarration: `Guess ${v[mid]}.` });
    if (v[mid] === target) {
      steps.push({ state: A(v, { pointers: { mid }, caption: `found at index ${mid}` }), highlight: { placed: [mid], visited: Array.from(gone) }, codeLine: 4, action: "done", narration: `<b>${v[mid]} = ${target}</b> 🎉 Found in a few steps — O(log n).`, kidNarration: "Found it! 🎉" });
      break;
    }
    if (v[mid] < target) { for (let k = lo; k <= mid; k++) gone.add(k); lo = mid + 1; steps.push({ state: A(v, { pointers: { low: lo, high: hi }, caption: `too small → right` }), highlight: { visited: Array.from(gone) }, codeLine: 6, action: "move", narration: "Too small — discard the left half.", kidNarration: "Too low!" }); }
    else { for (let k = mid; k <= hi; k++) gone.add(k); hi = mid - 1; steps.push({ state: A(v, { pointers: { low: lo, high: hi }, caption: `too big → left` }), highlight: { visited: Array.from(gone) }, codeLine: 8, action: "move", narration: "Too big — discard the right half.", kidNarration: "Too high!" }); }
  }
  return steps;
}

export const binarySearchProblems: DsaProblem[] = [
  {
    id: "binary-search:classic",
    topic: "binary-search",
    title: "Classic Binary Search",
    difficulty: "easy",
    statement: "Given a sorted list and a target, return the target's index, or -1 if it's not present.",
    examples: [{ input: "[1, 3, 5, 7, 9, 11], target = 7", output: "3" }],
    approachQuiz: { prompt: "Sorted list — fastest search?", options: ["Binary search (halve each step)", "Linear scan", "Two pointers"], answer: "Binary search (halve each step)", explain: "Sorted order lets you discard half each step — O(log n)." },
    hints: ["Keep a low and high boundary.", "Check the middle element.", "Discard the half that can't contain the target."],
    approach: "Maintain lo and hi. Look at the middle; if it equals the target you're done. If it's too small search the right half, otherwise the left half.",
    pythonCode: ["def bsearch(arr, target):", "    lo, hi = 0, len(arr) - 1", "    while lo <= hi:", "        mid = (lo + hi) // 2", "        if arr[mid] == target:", "            return mid", "        if arr[mid] < target:", "            lo = mid + 1", "        else:", "            hi = mid - 1", "    return -1"],
    complexity: { time: "O(log n)", space: "O(1)" },
    takeaway: "Binary search halves the space each step — O(log n) on sorted data.",
    code: { starter: "def bsearch(arr, target):\n    # return the index of target, or -1\n    pass", functionName: "bsearch", tests: [{ args: [[1, 3, 5, 7, 9, 11], 7], expected: 3 }, { args: [[1, 2, 3], 5], expected: -1 }, { args: [[5], 5], expected: 0 }] },
    walkthrough: { pythonCode: ["def bsearch(arr, target):", "    lo, hi = 0, len(arr) - 1", "    while lo <= hi:", "        mid = (lo + hi) // 2", "        if arr[mid] == target:", "            return mid", "        if arr[mid] < target:", "            lo = mid + 1", "        else:", "            hi = mid - 1", "    return -1"], StructureView: ArrayView, buildSteps: bsearchSteps },
  },
  {
    id: "binary-search:first-true",
    topic: "binary-search",
    title: "First 1 in a Sorted 0/1 List",
    difficulty: "medium",
    statement: "A list contains 0s followed by 1s (e.g. [0,0,1,1]). Return the index of the FIRST 1, or -1 if there are none.",
    examples: [{ input: "[0, 0, 1, 1]", output: "2" }, { input: "[0, 0]", output: "-1" }],
    approachQuiz: { prompt: "Find the boundary where 0 flips to 1?", options: ["Binary search on the condition", "Linear scan", "Sort it"], answer: "Binary search on the condition", explain: "Binary-search the first index that satisfies a monotonic condition." },
    hints: ["The list is monotonic: 0s then 1s.", "When you see a 1, the answer is here or earlier.", "Record it and keep searching left."],
    approach: "Binary search: when arr[mid] is 1, store mid as a candidate and move hi left to find an earlier 1; otherwise move lo right.",
    pythonCode: ["def first_true(arr):", "    lo, hi = 0, len(arr) - 1", "    ans = -1", "    while lo <= hi:", "        mid = (lo + hi) // 2", "        if arr[mid] == 1:", "            ans = mid", "            hi = mid - 1", "        else:", "            lo = mid + 1", "    return ans"],
    complexity: { time: "O(log n)", space: "O(1)" },
    takeaway: "Binary search the first index meeting a monotonic condition.",
    code: { starter: "def first_true(arr):\n    # index of the first 1, or -1\n    pass", functionName: "first_true", tests: [{ args: [[0, 0, 1, 1]], expected: 2 }, { args: [[1, 1]], expected: 0 }, { args: [[0, 0]], expected: -1 }] },
  },
  {
    id: "binary-search:isqrt",
    topic: "binary-search",
    title: "Integer Square Root",
    difficulty: "medium",
    statement: "Return the floor of the square root of a non-negative integer n (the largest m with m*m ≤ n). Don't use **0.5 or math.sqrt.",
    examples: [{ input: "16", output: "4" }, { input: "8", output: "2" }],
    approachQuiz: { prompt: "Find floor(sqrt(n)) without sqrt?", options: ["Binary search the answer 0..n", "Try every number up to n", "Sort"], answer: "Binary search the answer 0..n", explain: "You can binary-search a numeric answer range, not just an array." },
    hints: ["The answer is between 0 and n.", "Guess a middle m and compare m*m to n.", "Keep the largest m whose square doesn't exceed n."],
    approach: "Binary search m in [0, n]. If m*m ≤ n, it's a valid candidate — record it and search higher; otherwise search lower.",
    pythonCode: ["def isqrt(n):", "    lo, hi = 0, n", "    ans = 0", "    while lo <= hi:", "        mid = (lo + hi) // 2", "        if mid * mid <= n:", "            ans = mid", "            lo = mid + 1", "        else:", "            hi = mid - 1", "    return ans"],
    complexity: { time: "O(log n)", space: "O(1)" },
    takeaway: "You can binary-search an ANSWER range, not just an array.",
    code: { starter: "def isqrt(n):\n    # floor of the square root of n\n    pass", functionName: "isqrt", tests: [{ args: [16], expected: 4 }, { args: [8], expected: 2 }, { args: [1], expected: 1 }, { args: [0], expected: 0 }] },
  },
  {
    id: "binary-search:insert-pos",
    topic: "binary-search",
    title: "Search Insert Position",
    difficulty: "easy",
    statement: "Given a sorted list and a target, return the index where the target is, or where it should be inserted to keep the list sorted.",
    examples: [{ input: "[1, 3, 5, 6], target = 2", output: "1" }, { input: "[1, 3, 5, 6], target = 7", output: "4" }],
    approachQuiz: { prompt: "Find the insertion point?", options: ["Binary search for the lower bound", "Linear scan", "Append and sort"], answer: "Binary search for the lower bound", explain: "Find the first index whose value is ≥ target." },
    hints: ["You want the first index with value ≥ target.", "Use lo=0, hi=len (not len-1).", "Shrink hi to mid when arr[mid] ≥ target."],
    approach: "Lower-bound binary search: move lo past elements smaller than the target; the final lo is the insert position.",
    pythonCode: ["def insert_pos(arr, target):", "    lo, hi = 0, len(arr)", "    while lo < hi:", "        mid = (lo + hi) // 2", "        if arr[mid] < target:", "            lo = mid + 1", "        else:", "            hi = mid", "    return lo"],
    complexity: { time: "O(log n)", space: "O(1)" },
    takeaway: "Lower bound: first index with value ≥ target (use hi = len).",
    code: { starter: "def insert_pos(arr, target):\n    # index of target or where it should go\n    pass", functionName: "insert_pos", tests: [{ args: [[1, 3, 5, 6], 5], expected: 2 }, { args: [[1, 3, 5, 6], 2], expected: 1 }, { args: [[1, 3, 5, 6], 7], expected: 4 }] },
  },
  {
    id: "binary-search:peak",
    topic: "binary-search",
    title: "Peak of a Mountain List",
    difficulty: "medium",
    statement: "A list strictly increases then strictly decreases (a 'mountain'). Return the index of the peak (the maximum).",
    examples: [{ input: "[0, 2, 4, 3, 1]", output: "2" }],
    approachQuiz: { prompt: "Find the peak faster than O(n)?", options: ["Binary search using the slope", "Scan for the max", "Sort"], answer: "Binary search using the slope", explain: "If arr[mid] < arr[mid+1] you're climbing → go right; else go left." },
    hints: ["Compare the middle with its right neighbour.", "Rising slope? The peak is to the right.", "Falling slope? The peak is here or to the left."],
    approach: "Binary search: if arr[mid] < arr[mid+1] the peak is to the right (lo = mid+1); otherwise it's at mid or left (hi = mid). lo converges on the peak.",
    pythonCode: ["def peak(arr):", "    lo, hi = 0, len(arr) - 1", "    while lo < hi:", "        mid = (lo + hi) // 2", "        if arr[mid] < arr[mid + 1]:", "            lo = mid + 1", "        else:", "            hi = mid", "    return lo"],
    complexity: { time: "O(log n)", space: "O(1)" },
    takeaway: "Binary search on a slope finds a peak in O(log n).",
    code: { starter: "def peak(arr):\n    # return the index of the peak\n    pass", functionName: "peak", tests: [{ args: [[0, 2, 4, 3, 1]], expected: 2 }, { args: [[1, 2, 1]], expected: 1 }, { args: [[1, 2, 3]], expected: 2 }] },
  },
  {
    id: "binary-search:rotated-min",
    topic: "binary-search",
    title: "Minimum in a Rotated Sorted List",
    difficulty: "hard",
    statement: "A sorted list has been rotated at some pivot (e.g. [4,5,6,7,0,1,2]). Return its minimum value. No duplicates.",
    examples: [{ input: "[4, 5, 6, 7, 0, 1, 2]", output: "0" }],
    approachQuiz: { prompt: "Find the min without scanning all?", options: ["Binary search comparing to the right end", "Linear scan", "Sort"], answer: "Binary search comparing to the right end", explain: "If arr[mid] > arr[hi], the min is to the right of mid; else at mid or left." },
    hints: ["The minimum is the rotation point.", "Compare arr[mid] with arr[hi].", "If arr[mid] > arr[hi], the min is to the right."],
    approach: "Binary search: if arr[mid] > arr[hi] the smallest value is to the right (lo = mid+1); otherwise it's at mid or left (hi = mid). Return arr[lo].",
    pythonCode: ["def find_min(arr):", "    lo, hi = 0, len(arr) - 1", "    while lo < hi:", "        mid = (lo + hi) // 2", "        if arr[mid] > arr[hi]:", "            lo = mid + 1", "        else:", "            hi = mid", "    return arr[lo]"],
    complexity: { time: "O(log n)", space: "O(1)" },
    takeaway: "Rotated array: compare mid to the right end to find the pivot/min.",
    code: { starter: "def find_min(arr):\n    # minimum value of the rotated sorted list\n    pass", functionName: "find_min", tests: [{ args: [[4, 5, 6, 7, 0, 1, 2]], expected: 0 }, { args: [[3, 4, 5, 1, 2]], expected: 1 }, { args: [[1]], expected: 1 }] },
  },
];
