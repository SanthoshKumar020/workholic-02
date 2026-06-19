"use client";

import type { DsaProblem, Step } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const A = (values: number[], extra: Partial<ArrayState> = {}): ArrayState => ({ values, variant: "boxes", ...extra });

function maxSumSteps(): Step[] {
  const v = [2, 1, 5, 1, 3, 2];
  const k = 3;
  const steps: Step[] = [];
  let s = 0;
  for (let i = 0; i < k; i++) {
    s += v[i];
    steps.push({ state: A(v, { window: { start: 0, end: i }, caption: `sum = ${s}` }), highlight: { active: [i] }, codeLine: 1, action: "add", narration: `Build the first window of size ${k}: add ${v[i]}.`, kidNarration: `Add ${v[i]}.` });
  }
  let best = s;
  steps.push({ state: A(v, { window: { start: 0, end: k - 1 }, caption: `sum ${s}, best ${best}` }), highlight: { compare: [0, 1, 2] }, codeLine: 2, action: "compare", narration: `First window = <b>${s}</b>.`, kidNarration: `This window is ${s}.` });
  for (let i = k; i < v.length; i++) {
    const out = i - k;
    s += v[i] - v[out];
    best = Math.max(best, s);
    steps.push({ state: A(v, { window: { start: out + 1, end: i }, caption: `sum ${s}, best ${best}` }), highlight: { active: [i], visited: [out] }, codeLine: 4, action: "slide", narration: `Slide right: +${v[i]}, −${v[out]} = <b>${s}</b>.`, kidNarration: `Slide: +${v[i]} −${v[out]}.` });
  }
  steps.push({ state: A(v, { caption: `answer: ${best}` }), highlight: {}, codeLine: 6, action: "done", narration: `Biggest window sum is <b>${best}</b> — one pass, O(n).`, kidNarration: `Best is ${best}! 🎉` });
  return steps;
}

export const slidingWindowProblems: DsaProblem[] = [
  {
    id: "sliding-window:max-sum-k",
    topic: "sliding-window",
    title: "Max Sum of Size k",
    difficulty: "medium",
    statement: "Given a list of numbers and a window size k, return the largest sum of any k consecutive elements.",
    examples: [{ input: "[2, 1, 5, 1, 3, 2], k = 3", output: "9", note: "5 + 1 + 3" }],
    approachQuiz: { prompt: "Beat the O(n·k) recompute approach?", options: ["Slide: add new, drop old", "Recompute each window", "Sort first"], answer: "Slide: add new, drop old", explain: "Reuse the overlap — add the entering element, subtract the leaving one. O(n)." },
    hints: ["Each window shares all but one element with the previous one.", "Compute the first window's sum once.", "Then add the entering element and subtract the leaving one."],
    approach: "Compute the first window sum, then slide: for each new index add arr[i] and subtract arr[i-k]. Track the best sum.",
    pythonCode: ["def max_sum(arr, k):", "    s = sum(arr[:k])", "    best = s", "    for i in range(k, len(arr)):", "        s += arr[i] - arr[i-k]", "        best = max(best, s)", "    return best"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Fixed window: add entering, drop leaving — never recompute.",
    code: { starter: "def max_sum(arr, k):\n    # largest sum of k consecutive elements\n    pass", functionName: "max_sum", tests: [{ args: [[2, 1, 5, 1, 3, 2], 3], expected: 9 }, { args: [[1, 2, 3], 3], expected: 6 }, { args: [[5, 5, 5], 1], expected: 5 }] },
    walkthrough: { pythonCode: ["def max_sum(arr, k):", "    s = sum(arr[:k])", "    best = s", "    for i in range(k, len(arr)):", "        s += arr[i] - arr[i-k]", "        best = max(best, s)", "    return best"], StructureView: ArrayView, buildSteps: maxSumSteps },
  },
  {
    id: "sliding-window:window-sums",
    topic: "sliding-window",
    title: "Sum of Each Window",
    difficulty: "easy",
    statement: "Return the sum of every window of size k as you slide across the list, left to right.",
    examples: [{ input: "[1, 2, 3, 4], k = 2", output: "[3, 5, 7]" }],
    approachQuiz: { prompt: "Build all window sums efficiently?", options: ["Slide and reuse the overlap", "Sum each window from scratch"], answer: "Slide and reuse the overlap", explain: "Each new sum = old sum + entering − leaving." },
    hints: ["The first window's sum you compute directly.", "Each next sum changes by only two elements.", "Append each window's sum to the output."],
    approach: "Compute the first window sum, append it, then slide adding the new element and subtracting the one that left, appending each time.",
    pythonCode: ["def window_sums(arr, k):", "    s = sum(arr[:k])", "    out = [s]", "    for i in range(k, len(arr)):", "        s += arr[i] - arr[i-k]", "        out.append(s)", "    return out"],
    complexity: { time: "O(n)", space: "O(n)" },
    takeaway: "Slide once and reuse the overlap to emit every window sum.",
    code: { starter: "def window_sums(arr, k):\n    # list of each window's sum, left to right\n    pass", functionName: "window_sums", tests: [{ args: [[1, 2, 3, 4], 2], expected: [3, 5, 7] }, { args: [[4], 1], expected: [4] }] },
  },
  {
    id: "sliding-window:longest-unique",
    topic: "sliding-window",
    title: "Longest Substring Without Repeats",
    difficulty: "hard",
    statement: "Return the length of the longest substring that has no repeating characters.",
    examples: [{ input: '"abcabcbb"', output: "3", note: '"abc"' }, { input: '"bbbb"', output: "1" }],
    approachQuiz: { prompt: "Window that grows and shrinks?", options: ["Variable-size sliding window", "Fixed window of size k", "Two pointers from both ends"], answer: "Variable-size sliding window", explain: "Expand the right edge; when a repeat appears, move the left edge past it." },
    hints: ["Keep a window of unique characters.", "Remember the last position you saw each character.", "When a repeat falls inside the window, jump the left edge past it."],
    approach: "Track the last index of each character. Move right across the string; if the current char was seen inside the window, advance left to just after its last position. Track the max window length.",
    pythonCode: ["def longest_unique(s):", "    seen = {}", "    left = 0", "    best = 0", "    for right, ch in enumerate(s):", "        if ch in seen and seen[ch] >= left:", "            left = seen[ch] + 1", "        seen[ch] = right", "        best = max(best, right - left + 1)", "    return best"],
    complexity: { time: "O(n)", space: "O(min(n, alphabet))" },
    takeaway: "Variable window: grow right, jump left past repeats, track max length.",
    code: { starter: "def longest_unique(s):\n    # length of the longest substring with no repeats\n    pass", functionName: "longest_unique", tests: [{ args: ["abcabcbb"], expected: 3 }, { args: ["bbbb"], expected: 1 }, { args: ["pwwkew"], expected: 3 }] },
  },
  {
    id: "sliding-window:min-subarray",
    topic: "sliding-window",
    title: "Smallest Subarray ≥ Target",
    difficulty: "medium",
    statement: "Return the length of the shortest contiguous subarray whose sum is at least the target. Return 0 if none exists. All numbers are positive.",
    examples: [{ input: "[2, 3, 1, 2, 4, 3], target = 7", output: "2", note: "[4, 3]" }],
    approachQuiz: { prompt: "Shortest window meeting a condition?", options: ["Grow right, shrink left while valid", "Fixed window", "Binary search the array"], answer: "Grow right, shrink left while valid", explain: "Expand to reach the target, then shrink from the left to minimise length." },
    hints: ["Expand the window until the sum reaches the target.", "Then shrink from the left while it still meets the target.", "Track the smallest valid length."],
    approach: "Add elements on the right to a running sum. Whenever the sum is ≥ target, record the window length and shrink from the left, subtracting as you go.",
    pythonCode: ["def min_len(arr, target):", "    left = 0", "    s = 0", "    best = len(arr) + 1", "    for right in range(len(arr)):", "        s += arr[right]", "        while s >= target:", "            best = min(best, right - left + 1)", "            s -= arr[left]", "            left += 1", "    return best if best <= len(arr) else 0"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Min-length window: expand to satisfy, then shrink to minimise.",
    code: { starter: "def min_len(arr, target):\n    # shortest subarray length with sum >= target, else 0\n    pass", functionName: "min_len", tests: [{ args: [[2, 3, 1, 2, 4, 3], 7], expected: 2 }, { args: [[1, 1, 1], 10], expected: 0 }, { args: [[5], 5], expected: 1 }] },
  },
  {
    id: "sliding-window:max-vowels",
    topic: "sliding-window",
    title: "Most Vowels in a Window",
    difficulty: "medium",
    statement: "Return the maximum number of vowels in any substring of length k.",
    examples: [{ input: '"abciiidef", k = 3', output: "3", note: '"iii"' }],
    approachQuiz: { prompt: "Count vowels across each window?", options: ["Fixed window, adjust the count", "Recount each window", "Sort the string"], answer: "Fixed window, adjust the count", explain: "Add 1 when a vowel enters, subtract 1 when one leaves." },
    hints: ["A vowel is one of a, e, i, o, u.", "Count vowels in the first window.", "As you slide, +1 if the entering char is a vowel, −1 if the leaving one was."],
    approach: "Count vowels in the first k characters. Slide one step at a time, adjusting the count for the entering and leaving characters, and track the max.",
    pythonCode: ["def max_vowels(s, k):", "    vowels = set('aeiou')", "    count = sum(1 for c in s[:k] if c in vowels)", "    best = count", "    for i in range(k, len(s)):", "        if s[i] in vowels: count += 1", "        if s[i-k] in vowels: count -= 1", "        best = max(best, count)", "    return best"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Fixed window of counts: adjust for entering/leaving, track the max.",
    code: { starter: "def max_vowels(s, k):\n    # max vowels in any length-k substring\n    pass", functionName: "max_vowels", tests: [{ args: ["abciiidef", 3], expected: 3 }, { args: ["aeiou", 2], expected: 2 }, { args: ["b", 1], expected: 0 }] },
  },
];
