"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { TreeView, type TreeNodeT, type TreeState } from "@/components/dsa/views/TreeView";

const INSERT_CODE = [
  "def insert(root, val):",
  "    if root is None:",
  "        return Node(val)        # empty spot → place it",
  "    if val < root.val:",
  "        root.left = insert(root.left, val)   # go left",
  "    else:",
  "        root.right = insert(root.right, val) # go right",
  "    return root",
];
const SEARCH_CODE = [
  "def search(root, val):",
  "    while root:",
  "        if val == root.val: return root   # found",
  "        root = root.left if val < root.val else root.right",
  "    return None",
];

const SEQ = [5, 3, 8, 1, 4, 7];

/** Build the canonical demo tree (used by search + traversals too). */
function buildTree(): { nodes: TreeNodeT[]; root: number } {
  const nodes: TreeNodeT[] = [];
  let root: number | null = null;
  let id = 1;
  for (const v of SEQ) {
    const node: TreeNodeT = { id: id++, value: v, left: null, right: null };
    if (root == null) {
      root = node.id;
    } else {
      let curr = root;
      while (true) {
        const c = nodes.find((n) => n.id === curr)!;
        if (v < (c.value as number)) {
          if (c.left == null) { c.left = node.id; break; }
          curr = c.left;
        } else {
          if (c.right == null) { c.right = node.id; break; }
          curr = c.right;
        }
      }
    }
    nodes.push(node);
  }
  return { nodes, root: root! };
}

function buildInsert(): Step[] {
  const nodes: TreeNodeT[] = [];
  let root: number | null = null;
  let id = 1;
  const steps: Step[] = [];
  const snap = (extra: Partial<TreeState> = {}): TreeState => ({ nodes: nodes.map((n) => ({ ...n })), root, ...extra });

  steps.push({ state: snap({ caption: "empty tree" }), highlight: {}, codeLine: 0, action: "start", narration: `Build a Binary Search Tree by inserting ${SEQ.join(", ")}.`, kidNarration: "Let's sort toys: smaller left, bigger right!" });

  for (const v of SEQ) {
    const node: TreeNodeT = { id: id++, value: v, left: null, right: null };
    if (root == null) {
      root = node.id;
      nodes.push(node);
      steps.push({ state: snap({ pointers: { root: node.id }, caption: `insert ${v}` }), highlight: { placed: [node.id] }, codeLine: 2, action: "insert", narration: `${v} is the first value — it becomes the <b>root</b>.`, kidNarration: `${v} sits at the top!` });
      continue;
    }
    let curr = root;
    while (true) {
      const c = nodes.find((n) => n.id === curr)!;
      steps.push({ state: snap({ pointers: { curr }, caption: `insert ${v}` }), highlight: { compare: [curr] }, codeLine: 3, action: "compare", narration: `Compare ${v} with ${c.value}.`, kidNarration: `Is ${v} smaller than ${c.value}?` });
      if (v < (c.value as number)) {
        if (c.left == null) {
          c.left = node.id;
          nodes.push(node);
          steps.push({ state: snap({ pointers: { curr: node.id }, caption: `insert ${v}` }), highlight: { placed: [node.id] }, codeLine: 4, action: "insert", narration: `${v} &lt; ${c.value} and the left spot is empty → place ${v} on the <b>left</b>.`, kidNarration: `Smaller — go left, and it's empty!` });
          break;
        }
        curr = c.left;
      } else {
        if (c.right == null) {
          c.right = node.id;
          nodes.push(node);
          steps.push({ state: snap({ pointers: { curr: node.id }, caption: `insert ${v}` }), highlight: { placed: [node.id] }, codeLine: 6, action: "insert", narration: `${v} ≥ ${c.value} and the right spot is empty → place ${v} on the <b>right</b>.`, kidNarration: `Bigger — go right, and it's empty!` });
          break;
        }
        curr = c.right;
      }
    }
  }
  steps.push({ state: snap({ caption: "BST complete" }), highlight: { visited: nodes.map((n) => n.id) }, codeLine: 7, action: "done", narration: "Every left child is smaller, every right child is bigger. That order makes search fast — <b>O(log n)</b> when balanced.", kidNarration: "All sorted: small on the left, big on the right! 🎉" });
  return steps;
}

function buildSearch(): Step[] {
  const { nodes, root } = buildTree();
  const target = 4;
  const snap = (extra: Partial<TreeState> = {}): TreeState => ({ nodes, root, ...extra });
  const steps: Step[] = [{ state: snap({ caption: `search for ${target}` }), highlight: {}, codeLine: 0, action: "start", narration: `Search for <b>${target}</b>. At each node, go left if smaller, right if bigger.`, kidNarration: `Find ${target} — small left, big right!` }];
  let curr: number | null = root;
  const visited: number[] = [];
  while (curr != null) {
    const c = nodes.find((n) => n.id === curr)!;
    const found = c.value === target;
    steps.push({ state: snap({ pointers: { curr }, caption: `at ${c.value}` }), highlight: found ? { placed: [curr] } : { compare: [curr], visited: [...visited] }, codeLine: found ? 2 : 3, action: found ? "done" : "compare", narration: found ? `Found <b>${target}</b>! We only looked at ${visited.length + 1} nodes, not all of them.` : `${c.value} ≠ ${target}: go ${target < (c.value as number) ? "left (smaller)" : "right (bigger)"}.`, kidNarration: found ? "Found it! 🎉" : target < (c.value as number) ? "Go left!" : "Go right!" });
    if (found) break;
    visited.push(curr);
    curr = target < (c.value as number) ? c.left ?? null : c.right ?? null;
  }
  return steps;
}

export const treesBstModule: TopicModule = {
  slug: "trees-bst",
  StructureView: TreeView,
  demos: [
    { key: "insert", label: "Insert", emoji: "🌱", pythonCode: INSERT_CODE, buildSteps: buildInsert },
    { key: "search", label: "Search", emoji: "🔍", pythonCode: SEARCH_CODE, buildSteps: buildSearch },
  ],
  lesson: {
    story: [
      "Imagine sorting your toys onto a special shelf. 🧸",
      "You start with one toy in the middle. For each new toy, you compare sizes.",
      "Smaller? It goes to the <b>left</b>. Bigger? It goes to the <b>right</b>. Repeat down the branches.",
      "Now finding any toy is quick: at each step you skip <b>half</b> the shelf, just like the guessing game.",
      "…and grown-ups call this a <b>Binary Search Tree</b>!",
    ],
    steps: [
      "Each node has up to two children: a smaller-valued left and a bigger-valued right.",
      "Insert/search walks down comparing — going left or right each step.",
      "On a balanced tree that's O(log n); a lopsided tree degrades to O(n).",
    ],
    complexity: { time: "search/insert/delete: O(log n) balanced, O(n) worst", space: "O(n)", note: "Balance is everything — see AVL/Red-Black trees." },
    edgeCases: [
      "Inserting already-sorted values makes a 'linked list' tree → O(n).",
      "Deleting a node with two children: replace it with its in-order successor.",
      "Duplicates need a rule (skip, or always go right).",
    ],
    interviewTips: [
      "In-order traversal of a BST gives sorted output — a common trick.",
      "Self-balancing trees (AVL, Red-Black) guarantee O(log n).",
      "Validate-BST and lowest-common-ancestor are classic questions.",
      "Mention that a hash map beats a BST for pure lookup, but a BST keeps order.",
    ],
  },
  recall: [
    { question: "In a BST, a node's left child is always…", answer: "smaller", options: ["smaller", "bigger"], explain: "Smaller goes left, bigger goes right — that's the BST rule." },
    { question: "Searching a balanced BST is…", answer: "O(log n)", options: ["O(log n)", "O(n)"], explain: "Each comparison discards about half the tree." },
    { question: "An in-order traversal of a BST prints values in sorted order.", answer: true, explain: "Left → node → right naturally yields ascending order." },
  ],
};
