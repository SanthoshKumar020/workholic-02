"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { LinkedListView, type ListState } from "@/components/dsa/views/LinkedListView";

type N = { id: number; value: number };
const L = (nodes: N[], extra: Partial<ListState> = {}): ListState => ({ nodes, ...extra });

const TRAVERSE_CODE = [
  "class Node:",
  "    def __init__(self, val):",
  "        self.val = val",
  "        self.next = None",
  "",
  "def traverse(head):",
  "    curr = head",
  "    while curr:            # stop at None",
  "        print(curr.val)",
  "        curr = curr.next   # hop to next",
];
const PUSH_CODE = ["def push_front(head, val):", "    node = Node(val)", "    node.next = head    # point to old head", "    return node         # new head"];
const DELETE_CODE = [
  "def delete(head, target):",
  "    prev = head",
  "    while prev.next:",
  "        if prev.next.val == target:",
  "            prev.next = prev.next.next   # unlink",
  "            return head",
  "        prev = prev.next",
  "    return head",
];

function buildTraverse(): Step[] {
  const nodes: N[] = [
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
    { id: 4, value: 40 },
  ];
  const steps: Step[] = [
    { state: L(nodes, { pointers: { curr: 0 } }), highlight: {}, codeLine: 6, action: "start", narration: "Start at the <b>head</b>. Each node holds a value and a link to the next.", kidNarration: "Start at the first clue!" },
  ];
  for (let i = 0; i < nodes.length; i++) {
    steps.push({ state: L(nodes, { pointers: { curr: i } }), highlight: { active: [i], visited: Array.from({ length: i }, (_, k) => k) }, codeLine: 8, action: "visit", narration: `Read this node's value: <b>${nodes[i].value}</b>.`, kidNarration: `This clue says ${nodes[i].value}.` });
    const nextIdx = i + 1 < nodes.length ? i + 1 : -1;
    steps.push({
      state: L(nodes, { pointers: { curr: nextIdx } }),
      highlight: { visited: Array.from({ length: i + 1 }, (_, k) => k) },
      codeLine: 9,
      action: "move",
      narration: nextIdx === -1 ? "Follow the last arrow — it points to <b>None</b>. Stop." : "Follow the arrow to the next node (<b>curr = curr.next</b>).",
      kidNarration: nextIdx === -1 ? "The last clue points to nothing. Done!" : "Follow the arrow to the next clue!",
    });
  }
  steps.push({ state: L(nodes, { pointers: { curr: -1 }, caption: "visited all 4 — O(n)" }), highlight: { visited: nodes.map((_, i) => i) }, codeLine: 7, action: "done", narration: "We followed the chain end to end. Traversal is <b>O(n)</b>.", kidNarration: "We followed every clue to the treasure! 🎉" });
  return steps;
}

function buildPush(): Step[] {
  const before: N[] = [
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
  ];
  const after: N[] = [{ id: 9, value: 5 }, ...before];
  return [
    { state: L(before, { caption: "insert 5 at the head" }), highlight: {}, codeLine: 0, action: "start", narration: "We want to add <b>5</b> at the front.", kidNarration: "Add a new first clue: 5!" },
    { state: L(before, { incoming: { value: 5 } }), highlight: {}, codeLine: 1, action: "create", narration: "Make a new node holding 5.", kidNarration: "Make a new clue." },
    { state: L(before, { incoming: { value: 5 } }), highlight: { active: [0] }, codeLine: 2, action: "link", narration: "Point the new node's arrow at the <b>old head</b> (10).", kidNarration: "Point it at the old first clue." },
    { state: L(after, { pointers: { head: 0 }, caption: "inserted — O(1)" }), highlight: { placed: [0] }, codeLine: 3, action: "done", narration: "The new node becomes the head. Inserting at the head is <b>O(1)</b> — no shifting!", kidNarration: "5 is the new first clue! 🎉" },
  ];
}

function buildDelete(): Step[] {
  const before: N[] = [
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
    { id: 4, value: 40 },
  ];
  const after: N[] = [before[0], before[2], before[3]];
  return [
    { state: L(before, { pointers: { prev: 0 }, caption: "delete 20" }), highlight: {}, codeLine: 1, action: "start", narration: "Delete the node with value <b>20</b>. Walk until we're just before it.", kidNarration: "Find the clue before 20." },
    { state: L(before, { pointers: { prev: 0 } }), highlight: { active: [0], compare: [1] }, codeLine: 3, action: "compare", narration: "Is prev.next (20) the target? Yes!", kidNarration: "The next clue is 20 — that's it!" },
    { state: L(after, { pointers: { prev: 0 }, caption: "unlinked 20" }), highlight: { placed: [0] }, codeLine: 4, action: "delete", narration: "Point prev's arrow <b>past</b> 20, straight to 30. Nothing points to 20 now — it's gone.", kidNarration: "Skip over 20 — link 10 straight to 30!" },
    { state: L(after, { caption: "deleted — O(1) with the pointer in hand" }), highlight: { visited: [0, 1, 2] }, codeLine: 5, action: "done", narration: "Deleted! Relinking is <b>O(1)</b> once you're at the right spot.", kidNarration: "20 is gone! 🎉" },
  ];
}

export const linkedListsModule: TopicModule = {
  slug: "linked-lists",
  StructureView: LinkedListView,
  demos: [
    { key: "traverse", label: "Traverse", emoji: "🚶", pythonCode: TRAVERSE_CODE, buildSteps: buildTraverse },
    { key: "push", label: "Insert at head", emoji: "➕", pythonCode: PUSH_CODE, buildSteps: buildPush },
    { key: "delete", label: "Delete a node", emoji: "✂️", pythonCode: DELETE_CODE, buildSteps: buildDelete },
  ],
  lesson: {
    story: [
      "Think of a <b>treasure hunt</b>. 🗺️ You start with one clue.",
      "Each clue tells you the next thing AND <b>where to find the next clue</b>.",
      "You can't jump to clue #5 — you must follow them one by one from the start.",
      "But adding or removing a clue is easy: just change which clue points where.",
      "…and grown-ups call this a <b>Linked List</b>!",
    ],
    steps: [
      "Each node stores a value and a 'next' link to the following node.",
      "No indexes — to reach the k-th node you walk from the head: O(n).",
      "Insert/delete is O(1) once you hold the right node — just relink arrows.",
    ],
    complexity: { time: "access/search O(n), insert/delete at a known node O(1)", space: "O(n)", note: "Trades arrays' instant indexing for cheap insertion." },
    edgeCases: [
      "Always handle the head/empty-list case separately.",
      "Deleting needs the PREVIOUS node so you can relink.",
      "Losing a link = losing the rest of the list — reassign carefully.",
    ],
    interviewTips: [
      "Use a 'dummy head' node to simplify insert/delete edge cases.",
      "Reversing a list and slow/fast pointers (cycle detection) are classics.",
      "Linked lists win when you insert/delete a lot and rarely index.",
      "Draw the arrows before you code — pointer bugs hide in your head.",
    ],
  },
  recall: [
    { question: "To reach the 5th node in a linked list you must…", answer: "walk from the head", options: ["walk from the head", "jump straight there"], explain: "There are no indexes — you follow next links one by one (O(n))." },
    { question: "Inserting at the head of a linked list is…", answer: "O(1)", options: ["O(1)", "O(n)"], explain: "Just point the new node at the old head — no shifting." },
    { question: "Each linked-list node knows where the next node is.", answer: true, explain: "That 'next' link is exactly what chains the list together." },
  ],
};
