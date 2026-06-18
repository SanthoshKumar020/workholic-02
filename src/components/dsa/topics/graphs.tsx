"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { GraphView, type GNode, type GraphState } from "@/components/dsa/views/GraphView";

const NODES: GNode[] = [
  { id: 0, label: "A", x: 50, y: 50 },
  { id: 1, label: "B", x: 170, y: 40 },
  { id: 2, label: "C", x: 55, y: 160 },
  { id: 3, label: "D", x: 185, y: 155 },
  { id: 4, label: "E", x: 300, y: 90 },
  { id: 5, label: "F", x: 300, y: 200 },
];
const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [3, 5], [4, 5],
];
const LABEL = (id: number) => NODES[id].label;

// Adjacency list (sorted) from undirected edges.
const ADJ: number[][] = NODES.map(() => []);
for (const [a, b] of EDGES) {
  ADJ[a].push(b);
  ADJ[b].push(a);
}
ADJ.forEach((l) => l.sort((x, y) => x - y));

const BFS_CODE = [
  "from collections import deque",
  "def bfs(start):",
  "    q = deque([start])",
  "    seen = {start}",
  "    while q:",
  "        node = q.popleft()      # visit, ring by ring",
  "        for nb in adj[node]:",
  "            if nb not in seen:",
  "                seen.add(nb)",
  "                q.append(nb)",
];
const DFS_CODE = [
  "def dfs(node, seen):",
  "    seen.add(node)",
  "    visit(node)                 # go as deep as possible",
  "    for nb in adj[node]:",
  "        if nb not in seen:",
  "            dfs(nb, seen)",
];

function buildBfs(): Step[] {
  const snap = (extra: Partial<GraphState> = {}): GraphState => ({ nodes: NODES, edges: EDGES, ...extra });
  const q: number[] = [0];
  const seen = new Set([0]);
  const order: number[] = [];
  const steps: Step[] = [
    { state: snap({ pointers: { start: 0 }, caption: "queue: [A]" }), highlight: { compare: [0] }, codeLine: 2, action: "start", narration: "BFS explores in <b>rings</b>: all neighbours, then their neighbours.", kidNarration: "Like ripples in a pond — ring by ring!" },
  ];
  while (q.length) {
    const node = q.shift()!;
    order.push(node);
    steps.push({
      state: snap({ pointers: { node }, caption: `visited: ${order.map(LABEL).join(" ")}  •  queue: [${q.map(LABEL).join(" ")}]` }),
      highlight: { active: [node], visited: order.slice(0, -1) },
      codeLine: 5,
      action: "visit",
      narration: `Visit <b>${LABEL(node)}</b>, then add its unseen neighbours to the back of the queue.`,
      kidNarration: `Visit ${LABEL(node)}!`,
    });
    for (const nb of ADJ[node]) {
      if (!seen.has(nb)) {
        seen.add(nb);
        q.push(nb);
      }
    }
  }
  steps.push({ state: snap({ caption: `BFS order: ${order.map(LABEL).join(" → ")}` }), highlight: { visited: order }, codeLine: 4, action: "done", narration: "Everyone visited closest-first. BFS finds the <b>shortest path</b> in an unweighted graph. O(V + E).", kidNarration: "We rippled out to every town! 🎉" });
  return steps;
}

function buildDfs(): Step[] {
  const snap = (extra: Partial<GraphState> = {}): GraphState => ({ nodes: NODES, edges: EDGES, ...extra });
  const seen = new Set<number>();
  const order: number[] = [];
  const steps: Step[] = [
    { state: snap({ pointers: { start: 0 }, caption: "start at A" }), highlight: { compare: [0] }, codeLine: 0, action: "start", narration: "DFS dives as <b>deep</b> as it can, then backs up.", kidNarration: "Like a maze — go as far as you can, then back up!" },
  ];
  const dfs = (node: number) => {
    seen.add(node);
    order.push(node);
    steps.push({
      state: snap({ pointers: { node }, caption: `path so far: ${order.map(LABEL).join(" → ")}` }),
      highlight: { active: [node], visited: order.slice(0, -1) },
      codeLine: 2,
      action: "visit",
      narration: `Visit <b>${LABEL(node)}</b> and immediately dive into its first unseen neighbour.`,
      kidNarration: `Go deep to ${LABEL(node)}!`,
    });
    for (const nb of ADJ[node]) if (!seen.has(nb)) dfs(nb);
  };
  dfs(0);
  steps.push({ state: snap({ caption: `DFS order: ${order.map(LABEL).join(" → ")}` }), highlight: { visited: order }, codeLine: 5, action: "done", narration: "DFS reached every town by going deep first. Also O(V + E); uses the call stack.", kidNarration: "Explored the whole map by going deep! 🎉" });
  return steps;
}

export const graphsModule: TopicModule = {
  slug: "graphs",
  StructureView: GraphView,
  demos: [
    { key: "bfs", label: "BFS (ripples)", emoji: "🌊", pythonCode: BFS_CODE, buildSteps: buildBfs },
    { key: "dfs", label: "DFS (dive deep)", emoji: "🤿", pythonCode: DFS_CODE, buildSteps: buildDfs },
  ],
  lesson: {
    story: [
      "Picture a <b>map of towns joined by roads</b>. 🛣️ Each town is a node; each road is an edge.",
      "To explore them all you need a plan. Two famous ones:",
      "<b>BFS</b> is like <b>ripples in a pond</b> — visit everything one road away, then two roads away, and so on.",
      "<b>DFS</b> is like exploring a <b>maze</b> — follow one path as far as it goes, then back up and try another.",
      "…and grown-ups call this whole idea a <b>Graph</b>!",
    ],
    steps: [
      "Store the graph as an adjacency list: each node → its neighbours.",
      "BFS uses a QUEUE (first-in-first-out) → shortest path in unweighted graphs.",
      "DFS uses a STACK / recursion → great for paths, cycles, and connectivity.",
    ],
    complexity: { time: "O(V + E)", space: "O(V)", note: "V = nodes (vertices), E = edges." },
    edgeCases: [
      "Always track 'seen' nodes or you'll loop forever on cycles.",
      "Disconnected graphs: loop over all nodes to reach every component.",
      "Weighted shortest path needs Dijkstra, not plain BFS.",
    ],
    interviewTips: [
      "BFS for shortest path / fewest steps; DFS for 'does a path exist' / cycles.",
      "A grid is a graph: each cell connects to its neighbours.",
      "Adjacency list for sparse graphs, adjacency matrix for dense ones.",
      "Trees are just acyclic connected graphs — same traversals apply.",
    ],
  },
  recall: [
    { question: "Which traversal finds the shortest path in an unweighted graph?", answer: "BFS", options: ["BFS", "DFS"], explain: "BFS expands ring by ring, so it reaches each node by the fewest edges." },
    { question: "DFS uses a stack (or recursion) to go deep.", answer: true, explain: "It follows one path to the end, then backtracks — that's a stack." },
    { question: "Without tracking visited nodes, a graph traversal can…", answer: "loop forever", options: ["loop forever", "skip nodes"], explain: "Cycles send you round and round unless you mark nodes seen." },
  ],
};
