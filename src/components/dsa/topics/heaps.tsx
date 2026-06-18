"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { TreeView, type TreeNodeT, type TreeState } from "@/components/dsa/views/TreeView";

const PUSH_CODE = [
  "def push(heap, val):",
  "    heap.append(val)              # add at the end",
  "    i = len(heap) - 1",
  "    while i > 0:",
  "        parent = (i - 1) // 2",
  "        if heap[i] <= heap[parent]: break   # in place",
  "        heap[i], heap[parent] = heap[parent], heap[i]",
  "        i = parent                # bubble up",
];

/** Render a heap array as a complete binary tree (id = array index). */
function heapTree(arr: number[], extra: Partial<TreeState> = {}): TreeState {
  const n = arr.length;
  const nodes: TreeNodeT[] = arr.map((v, i) => ({
    id: i,
    value: v,
    left: 2 * i + 1 < n ? 2 * i + 1 : null,
    right: 2 * i + 2 < n ? 2 * i + 2 : null,
  }));
  return { nodes, root: n ? 0 : null, ...extra };
}

function buildPush(): Step[] {
  const seq = [3, 7, 5, 9, 2];
  const arr: number[] = [];
  const steps: Step[] = [
    { state: heapTree(arr, { caption: "empty heap" }), highlight: {}, codeLine: 0, action: "start", narration: `Build a <b>max-heap</b> by pushing ${seq.join(", ")}. The biggest must always float to the top.`, kidNarration: "It's a tournament — the champion rises to the top!" },
  ];
  for (const v of seq) {
    arr.push(v);
    let i = arr.length - 1;
    steps.push({ state: heapTree([...arr], { pointers: { i }, caption: `[${arr.join(", ")}]` }), highlight: { active: [i] }, codeLine: 1, action: "add", narration: `Add ${v} at the next open spot (bottom of the tree).`, kidNarration: `${v} enters the tournament!` });
    while (i > 0) {
      const parent = (i - 1) >> 1;
      steps.push({ state: heapTree([...arr], { pointers: { i, parent }, caption: `${arr[i]} vs parent ${arr[parent]}` }), highlight: { active: [i], compare: [parent] }, codeLine: 5, action: "compare", narration: `Is ${arr[i]} bigger than its parent ${arr[parent]}?`, kidNarration: `Can ${arr[i]} beat ${arr[parent]}?` });
      if (arr[i] <= arr[parent]) {
        steps.push({ state: heapTree([...arr], { pointers: { i }, caption: `[${arr.join(", ")}]` }), highlight: { placed: [i] }, codeLine: 5, action: "place", narration: `No — ${arr[i]} stays. Heap order is restored.`, kidNarration: "It stays put." });
        break;
      }
      [arr[i], arr[parent]] = [arr[parent], arr[i]];
      steps.push({ state: heapTree([...arr], { pointers: { i: parent }, caption: `[${arr.join(", ")}]` }), highlight: { swap: [i, parent] }, codeLine: 6, action: "swap", narration: `Yes — swap up. ${arr[parent]} climbs toward the top.`, kidNarration: "It wins and moves up!" });
      i = parent;
    }
  }
  steps.push({ state: heapTree([...arr], { pointers: { i: 0 }, caption: `max = ${arr[0]}` }), highlight: { placed: [0] }, codeLine: 7, action: "done", narration: `The largest value, <b>${arr[0]}</b>, sits at the root. Each push is <b>O(log n)</b>.`, kidNarration: `The champion ${arr[0]} is on top! 🏆` });
  return steps;
}

export const heapsModule: TopicModule = {
  slug: "heaps",
  StructureView: TreeView,
  demos: [{ key: "push", label: "Push (bubble up)", emoji: "🏆", pythonCode: PUSH_CODE, buildSteps: buildPush }],
  lesson: {
    story: [
      "Picture a <b>tournament bracket</b>. 🏆",
      "Whenever a new player joins, they challenge their parent above them.",
      "If they're stronger, they swap up — and keep challenging until someone beats them.",
      "So the overall champion always ends up at the very top, ready to grab in one step.",
      "…and grown-ups call this a <b>Heap</b>!",
    ],
    steps: [
      "A heap is a complete binary tree (stored compactly as an array).",
      "Max-heap: every parent ≥ its children, so the max is always the root.",
      "Push = add at the end then 'bubble up'; pop = take the root then 'sift down'. Both O(log n).",
    ],
    complexity: { time: "push/pop O(log n), peek O(1)", space: "O(n)", note: "Array layout: children of i are 2i+1 and 2i+2." },
    edgeCases: [
      "It's NOT fully sorted — only the root is guaranteed extreme.",
      "Building a heap from n items is O(n) with heapify (not n log n).",
      "Python's heapq is a MIN-heap; negate values for a max-heap.",
    ],
    interviewTips: [
      "Reach for a heap on 'top-K', 'k-th largest', or 'merge k sorted lists'.",
      "A priority queue IS a heap.",
      "Two heaps (min+max) track a running median.",
      "Mention heapify is O(n) — a common gotcha.",
    ],
  },
  recall: [
    { question: "In a max-heap, the largest value is always at the…", answer: "root", options: ["root", "leaves"], explain: "Every parent ≥ its children, so the max bubbles to the root." },
    { question: "Pushing onto a heap is…", answer: "O(log n)", options: ["O(log n)", "O(n)"], explain: "The new item bubbles up at most the height of the tree." },
    { question: "A heap keeps ALL its elements fully sorted.", answer: false, explain: "Only the heap property holds — just the root is guaranteed extreme." },
  ],
};
