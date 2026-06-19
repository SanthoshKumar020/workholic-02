"use client";

import type { DsaProblem, Step } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const A = (values: (number | string)[], extra: Partial<ArrayState> = {}): ArrayState => ({ values, variant: "boxes", ...extra });

// ── Walkthrough step generators (reuse the shared ArrayView) ─────────────────
function reverseSteps(): Step[] {
  const v: (number | string)[] = ["h", "e", "l", "l", "o"];
  const steps: Step[] = [{ state: A([...v], { pointers: { l: 0, r: 4 } }), highlight: {}, codeLine: 1, action: "start", narration: "Place one pointer at each end.", kidNarration: "Friends at both ends!" }];
  let l = 0, r = v.length - 1;
  while (l < r) {
    steps.push({ state: A([...v], { pointers: { l, r } }), highlight: { swap: [l, r] }, codeLine: 3, action: "swap", narration: `Swap '${v[l]}' and '${v[r]}'.`, kidNarration: "Trade places!" });
    [v[l], v[r]] = [v[r], v[l]];
    l++; r--;
    steps.push({ state: A([...v], { pointers: { l, r } }), highlight: { placed: [l - 1, r + 1] }, codeLine: 4, action: "move", narration: "Step both pointers inward.", kidNarration: "Step inward." });
  }
  steps.push({ state: A([...v], { caption: "reversed!" }), highlight: { placed: v.map((_, i) => i) }, codeLine: 5, action: "done", narration: "Pointers met — done, with <b>O(1)</b> extra space.", kidNarration: "Flipped! 🎉" });
  return steps;
}

function twoSumSteps(): Step[] {
  const v = [2, 3, 5, 8, 11];
  const target = 10;
  const steps: Step[] = [{ state: A(v, { pointers: { l: 0, r: 4 }, caption: `target ${target}` }), highlight: {}, codeLine: 1, action: "start", narration: "Sorted array — pointers at both ends.", kidNarration: "Find two that make 10!" }];
  let l = 0, r = v.length - 1;
  while (l < r) {
    const s = v[l] + v[r];
    const hit = s === target;
    steps.push({ state: A(v, { pointers: { l, r }, caption: `${v[l]} + ${v[r]} = ${s}` }), highlight: hit ? { placed: [l, r] } : { compare: [l, r] }, codeLine: hit ? 4 : 3, action: hit ? "done" : "compare", narration: hit ? `<b>${v[l]} + ${v[r]} = ${target}</b> ✅` : s < target ? `${s} &lt; ${target} → move <b>left</b> up.` : `${s} &gt; ${target} → move <b>right</b> down.`, kidNarration: hit ? "Found it! 🎉" : s < target ? "Too small." : "Too big." });
    if (hit) break;
    if (s < target) l++; else r--;
  }
  return steps;
}

function moveZeroesSteps(): Step[] {
  const v = [0, 1, 0, 3, 12];
  const steps: Step[] = [{ state: A([...v], { pointers: { slow: 0 } }), highlight: {}, codeLine: 1, action: "start", narration: "<b>slow</b> marks the next non-zero slot; <b>fast</b> scans.", kidNarration: "Push zeros to the back!" }];
  let slow = 0;
  for (let fast = 0; fast < v.length; fast++) {
    steps.push({ state: A([...v], { pointers: { slow, fast } }), highlight: { compare: [fast] }, codeLine: 3, action: "compare", narration: `Is ${v[fast]} non-zero?`, kidNarration: `Look at ${v[fast]}.` });
    if (v[fast] !== 0) {
      [v[slow], v[fast]] = [v[fast], v[slow]];
      steps.push({ state: A([...v], { pointers: { slow, fast } }), highlight: { swap: [slow, fast] }, codeLine: 4, action: "swap", narration: `Non-zero — swap it to slot ${slow} and advance slow.`, kidNarration: "Move it up front!" });
      slow++;
    }
  }
  steps.push({ state: A([...v], { caption: "zeros pushed to the end!" }), highlight: { placed: v.map((_, i) => i) }, codeLine: 6, action: "done", narration: "Non-zeros kept their order; zeros fell to the back. O(n), O(1) space.", kidNarration: "Zeros at the back! 🎉" });
  return steps;
}

export const twoPointersProblems: DsaProblem[] = [
  {
    id: "two-pointers:reverse-string",
    topic: "two-pointers",
    title: "Reverse a List In Place",
    difficulty: "easy",
    statement: "You're given a list of single characters. Reverse it in place — modify the same list, don't build a new one — and return it.",
    examples: [{ input: "['h','e','l','l','o']", output: "['o','l','l','e','h']" }],
    approachQuiz: {
      prompt: "Most space-efficient way to reverse a list in place?",
      options: ["Two pointers swapping from both ends", "Build a new reversed list", "Sort it", "Use a hash map"],
      answer: "Two pointers swapping from both ends",
      explain: "Swap the ends and walk inward — O(1) extra space.",
    },
    hints: ["Where could you place pointers to start?", "Put one at the start and one at the end. What do you do with those two values?", "Swap them, then move both inward. Stop when they meet."],
    approach: "Place a left pointer at index 0 and a right pointer at the last index. Swap the two characters, then move left forward and right backward. Stop when they cross.",
    pythonCode: ["def reverse(arr):", "    l, r = 0, len(arr) - 1", "    while l < r:", "        arr[l], arr[r] = arr[r], arr[l]", "        l, r = l + 1, r - 1", "    return arr"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Reverse in place = two pointers swapping from both ends (O(1) space).",
    code: {
      starter: "def reverse(arr):\n    # reverse arr in place and return it\n    return arr",
      functionName: "reverse",
      tests: [
        { args: [["h", "e", "l", "l", "o"]], expected: ["o", "l", "l", "e", "h"] },
        { args: [["a", "b"]], expected: ["b", "a"] },
      ],
    },
    walkthrough: { pythonCode: ["def reverse(arr):", "    l, r = 0, len(arr) - 1", "    while l < r:", "        arr[l], arr[r] = arr[r], arr[l]", "        l, r = l + 1, r - 1", "    return arr"], StructureView: ArrayView, buildSteps: reverseSteps },
  },
  {
    id: "two-pointers:two-sum-sorted",
    topic: "two-pointers",
    title: "Two-Sum on a Sorted List",
    difficulty: "easy",
    statement: "Given a sorted list of numbers and a target, return the indices of the two numbers that add up to the target. Exactly one answer exists.",
    examples: [{ input: "[2, 3, 5, 8, 11], target = 10", output: "[0, 3]", note: "2 + 8 = 10" }],
    approachQuiz: {
      prompt: "The list is SORTED. Best approach?",
      options: ["Two pointers from both ends", "Check every pair (nested loops)", "Binary search for each number", "Reverse the list"],
      answer: "Two pointers from both ends",
      explain: "Sorted order lets you grow or shrink the sum by moving a pointer — O(n).",
    },
    hints: ["The list is sorted — can that help you avoid checking every pair?", "Start one pointer low and one high. Look at their sum.", "Sum too small? Move left up. Too big? Move right down."],
    approach: "Left at the start, right at the end. If the pair sums to the target, you're done. If the sum is too small, move left rightward (bigger value); if too big, move right leftward (smaller value). One pass.",
    pythonCode: ["def two_sum_sorted(arr, target):", "    l, r = 0, len(arr) - 1", "    while l < r:", "        s = arr[l] + arr[r]", "        if s == target:", "            return [l, r]", "        if s < target:", "            l += 1", "        else:", "            r -= 1"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Sorted + 'find a pair' → two pointers from both ends, not nested loops.",
    code: {
      starter: "def two_sum_sorted(arr, target):\n    # return the indices [i, j] of the two numbers adding to target\n    pass",
      functionName: "two_sum_sorted",
      tests: [
        { args: [[2, 3, 5, 8, 11], 10], expected: [0, 3] },
        { args: [[1, 2, 4, 7], 9], expected: [1, 3] },
      ],
    },
    walkthrough: { pythonCode: ["def two_sum_sorted(arr, target):", "    l, r = 0, len(arr) - 1", "    while l < r:", "        s = arr[l] + arr[r]", "        if s == target:", "            return [l, r]", "        if s < target:", "            l += 1", "        else:", "            r -= 1"], StructureView: ArrayView, buildSteps: twoSumSteps },
  },
  {
    id: "two-pointers:valid-palindrome",
    topic: "two-pointers",
    title: "Valid Palindrome",
    difficulty: "easy",
    statement: "Return true if a string reads the same forwards and backwards, considering only letters and ignoring case.",
    examples: [{ input: '"Race car"', output: "true" }, { input: '"hello"', output: "false" }],
    approachQuiz: {
      prompt: "Check a palindrome without extra memory?",
      options: ["Two pointers comparing ends inward", "Reverse the string and compare", "Use a stack", "Sort the characters"],
      answer: "Two pointers comparing ends inward",
      explain: "Compare the outermost characters and move inward — O(1) space.",
    },
    hints: ["A palindrome mirrors around its center.", "Compare the first and last letters, then move inward.", "Skip anything that isn't a letter, and lowercase before comparing."],
    approach: "Left and right pointers at the ends. Skip non-letters. Compare the lowercased characters; if they ever differ it's not a palindrome. Move inward until the pointers cross.",
    pythonCode: ["def is_palindrome(s):", "    l, r = 0, len(s) - 1", "    while l < r:", "        while l < r and not s[l].isalpha(): l += 1", "        while l < r and not s[r].isalpha(): r -= 1", "        if s[l].lower() != s[r].lower():", "            return False", "        l, r = l + 1, r - 1", "    return True"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Palindrome check = two pointers comparing inward (O(1) space).",
    code: {
      starter: "def is_palindrome(s):\n    # True if s reads the same both ways (letters only, ignore case)\n    pass",
      functionName: "is_palindrome",
      tests: [
        { args: ["Race car"], expected: true },
        { args: ["hello"], expected: false },
      ],
    },
  },
  {
    id: "two-pointers:remove-duplicates",
    topic: "two-pointers",
    title: "Remove Duplicates from a Sorted List",
    difficulty: "medium",
    statement: "Given a sorted list, remove duplicates in place so each value appears once. Return the new length; the first k slots should hold the unique values in order.",
    examples: [{ input: "[1, 1, 2, 2, 2, 3]", output: "4", note: "list begins [1, 2, 3, ...]" }],
    approachQuiz: {
      prompt: "Sorted list, remove duplicates in place — which pointers?",
      options: ["Slow + fast (same direction)", "Two pointers from both ends", "Binary search", "A second list"],
      answer: "Slow + fast (same direction)",
      explain: "A slow 'writer' and a fast 'scanner' overwrite duplicates in one pass.",
    },
    hints: ["In a sorted list, duplicates sit next to each other.", "Keep a 'write' pointer for the next unique slot and a 'scan' pointer.", "When scan finds a value different from the last one written, write it and advance the writer."],
    approach: "A slow pointer marks where the next unique value goes (start at 1). Fast scans from index 1. Whenever arr[fast] differs from the last written value, write it at slow and advance slow. slow becomes the new length.",
    pythonCode: ["def remove_dups(arr):", "    if not arr: return 0", "    slow = 1", "    for fast in range(1, len(arr)):", "        if arr[fast] != arr[slow - 1]:", "            arr[slow] = arr[fast]", "            slow += 1", "    return slow"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "In-place de-dup of a sorted list = slow/fast same-direction pointers.",
    code: {
      starter: "def remove_dups(arr):\n    # remove duplicates in place; return the new length\n    pass",
      functionName: "remove_dups",
      tests: [
        { args: [[1, 1, 2, 2, 2, 3]], expected: 4 },
        { args: [[5]], expected: 1 },
      ],
    },
  },
  {
    id: "two-pointers:move-zeroes",
    topic: "two-pointers",
    title: "Move Zeroes to the End",
    difficulty: "medium",
    statement: "Move every zero in a list to the end while keeping the order of the non-zero values. Do it in place.",
    examples: [{ input: "[0, 1, 0, 3, 12]", output: "[1, 3, 12, 0, 0]" }],
    approachQuiz: {
      prompt: "Push zeros to the end, keep order, in place?",
      options: ["Slow + fast pointers", "Sort the list", "Count zeros and rebuild", "Two pointers from both ends"],
      answer: "Slow + fast pointers",
      explain: "Slow marks the next non-zero slot; fast finds non-zeros to swap forward.",
    },
    hints: ["You want non-zeros packed to the front and zeros falling back.", "Use a 'slow' index for the next non-zero position.", "When fast finds a non-zero, swap it into slow and advance slow."],
    approach: "slow = the next position for a non-zero value. Scan fast across the list; each time arr[fast] is non-zero, swap it into arr[slow] and increment slow. Zeros naturally end up at the back, order preserved.",
    pythonCode: ["def move_zeroes(arr):", "    slow = 0", "    for fast in range(len(arr)):", "        if arr[fast] != 0:", "            arr[slow], arr[fast] = arr[fast], arr[slow]", "            slow += 1", "    return arr"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Partition in place (move X to the end) = slow/fast pointers.",
    code: {
      starter: "def move_zeroes(arr):\n    # move zeros to the end in place; return arr\n    return arr",
      functionName: "move_zeroes",
      tests: [
        { args: [[0, 1, 0, 3, 12]], expected: [1, 3, 12, 0, 0] },
        { args: [[0, 0, 1]], expected: [1, 0, 0] },
      ],
    },
    walkthrough: { pythonCode: ["def move_zeroes(arr):", "    slow = 0", "    for fast in range(len(arr)):", "        if arr[fast] != 0:", "            arr[slow], arr[fast] = arr[fast], arr[slow]", "            slow += 1", "    return arr"], StructureView: ArrayView, buildSteps: moveZeroesSteps },
  },
  {
    id: "two-pointers:widest-water",
    topic: "two-pointers",
    title: "Widest Water",
    difficulty: "medium",
    statement: "Given the heights of vertical lines on a number line, pick two lines that together with the x-axis hold the most water. Return the max area (width × the shorter height).",
    examples: [{ input: "[1, 8, 6, 2, 5, 4, 8, 3, 7]", output: "49" }],
    approachQuiz: {
      prompt: "Maximize the area between two lines — beat O(n²)?",
      options: ["Two pointers from both ends", "Check every pair", "Binary search", "Fixed-size sliding window"],
      answer: "Two pointers from both ends",
      explain: "Start widest, then move the shorter line inward — the taller one can only lose width.",
    },
    hints: ["Area = distance between the lines × the shorter line.", "Start with the widest possible pair (both ends).", "Move whichever pointer is at the shorter line inward — moving the taller one can't help."],
    approach: "Left and right at the ends (max width). Compute the area and track the max. Then move the pointer at the SHORTER line inward, because moving the taller line only reduces width without raising the limiting height. Repeat until they meet.",
    pythonCode: ["def max_area(h):", "    l, r = 0, len(h) - 1", "    best = 0", "    while l < r:", "        area = (r - l) * min(h[l], h[r])", "        best = max(best, area)", "        if h[l] < h[r]:", "            l += 1", "        else:", "            r -= 1", "    return best"],
    complexity: { time: "O(n)", space: "O(1)" },
    takeaway: "Max area between two lines: two pointers, always move the shorter line inward.",
    code: {
      starter: "def max_area(h):\n    # return the max water area between two of the lines\n    pass",
      functionName: "max_area",
      tests: [
        { args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
        { args: [[1, 1]], expected: 1 },
      ],
    },
  },
];
