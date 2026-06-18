"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { TreeView, type TreeNodeT, type TreeState } from "@/components/dsa/views/TreeView";

// Canonical demo tree:        5
//                          3     8
//                        1   4  7
const NODES: TreeNodeT[] = [
  { id: 1, value: 5, left: 2, right: 3 },
  { id: 2, value: 3, left: 4, right: 5 },
  { id: 3, value: 8, left: 6, right: null },
  { id: 4, value: 1, left: null, right: null },
  { id: 5, value: 4, left: null, right: null },
  { id: 6, value: 7, left: null, right: null },
];
const ROOT = 1;
const byId = (id: number) => NODES.find((n) => n.id === id)!;

const IN_CODE = ["def inorder(node):", "    if not node: return", "    inorder(node.left)", "    print(node.val)      # visit", "    inorder(node.right)"];
const PRE_CODE = ["def preorder(node):", "    if not node: return", "    print(node.val)      # visit", "    preorder(node.left)", "    preorder(node.right)"];
const POST_CODE = ["def postorder(node):", "    if not node: return", "    postorder(node.left)", "    postorder(node.right)", "    print(node.val)      # visit"];

type Order = "in" | "pre" | "post";
function visitOrder(kind: Order): number[] {
  const out: number[] = [];
  const rec = (id: number | null | undefined) => {
    if (id == null) return;
    const n = byId(id);
    if (kind === "pre") out.push(id);
    rec(n.left);
    if (kind === "in") out.push(id);
    rec(n.right);
    if (kind === "post") out.push(id);
  };
  rec(ROOT);
  return out;
}

function buildTraversal(kind: Order, codeLine: number): () => Step[] {
  return () => {
    const order = visitOrder(kind);
    const snap = (extra: Partial<TreeState> = {}): TreeState => ({ nodes: NODES, root: ROOT, ...extra });
    const name = kind === "in" ? "In-order" : kind === "pre" ? "Pre-order" : "Post-order";
    const steps: Step[] = [
      { state: snap({ caption: `${name}: visiting every room` }), highlight: {}, codeLine: 0, action: "start", narration: `${name} traversal: we visit every node in a fixed order.`, kidNarration: "Let's tour every room in the house!" },
    ];
    const visited: number[] = [];
    order.forEach((id, i) => {
      visited.push(id);
      steps.push({
        state: snap({ pointers: { now: id }, caption: `order: ${visited.map((v) => byId(v).value).join(", ")}` }),
        highlight: { active: [id], visited: visited.slice(0, -1) },
        codeLine,
        action: "visit",
        narration: `Visit <b>${byId(id).value}</b> (${i + 1} of ${order.length}).`,
        kidNarration: `Room ${byId(id).value}!`,
      });
    });
    const result = order.map((v) => byId(v).value).join(", ");
    steps.push({ state: snap({ caption: `${name} → ${result}` }), highlight: { visited: order }, codeLine, action: "done", narration: `${name} result: <b>${result}</b>.${kind === "in" ? " Notice it comes out <b>sorted</b> — that's special to BSTs!" : ""}`, kidNarration: "Visited every room! 🎉" });
    return steps;
  };
}

export const treeTraversalsModule: TopicModule = {
  slug: "tree-traversals",
  StructureView: TreeView,
  demos: [
    { key: "in", label: "In-order", emoji: "↔️", pythonCode: IN_CODE, buildSteps: buildTraversal("in", 3) },
    { key: "pre", label: "Pre-order", emoji: "⬇️", pythonCode: PRE_CODE, buildSteps: buildTraversal("pre", 2) },
    { key: "post", label: "Post-order", emoji: "⬆️", pythonCode: POST_CODE, buildSteps: buildTraversal("post", 4) },
  ],
  lesson: {
    story: [
      "Think of the tree as a <b>house</b>, and each node is a room. 🏠",
      "A traversal is a plan for visiting <b>every room</b> exactly once.",
      "<b>In-order</b>: do the left rooms, then this room, then the right rooms.",
      "<b>Pre-order</b>: this room first, then left, then right. <b>Post-order</b>: left, right, then this room last.",
      "…and grown-ups call these <b>Tree Traversals</b>!",
    ],
    steps: [
      "In-order (Left, Node, Right): on a BST this prints values sorted.",
      "Pre-order (Node, Left, Right): great for copying/serialising a tree.",
      "Post-order (Left, Right, Node): great for deleting/freeing a tree bottom-up.",
    ],
    complexity: { time: "O(n) — every node once", space: "O(h) recursion stack (h = height)", note: "Breadth-first (level-order) uses a queue instead." },
    edgeCases: [
      "Deep trees can overflow the recursion stack — use an explicit stack.",
      "Level-order traversal needs a queue (BFS), not recursion.",
      "Always handle the empty/None node as the base case.",
    ],
    interviewTips: [
      "Memorise where the 'visit' sits: pre = before children, in = between, post = after.",
      "In-order on a BST = sorted output (used to validate a BST).",
      "Post-order is the safe order to free or fold a tree.",
      "Know the iterative stack versions, not just recursion.",
    ],
  },
  recall: [
    { question: "In-order traversal of a BST gives values in…", answer: "sorted order", options: ["sorted order", "random order"], explain: "Left → node → right visits smaller values first." },
    { question: "Pre-order visits the current node…", answer: "before its children", options: ["before its children", "after its children"], explain: "Pre = 'node first', then left, then right." },
    { question: "Visiting every node once is O(n).", answer: true, explain: "Each of the n nodes is touched exactly once." },
  ],
};
