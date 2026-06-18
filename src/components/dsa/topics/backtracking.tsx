"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { GridView, type GridState } from "@/components/dsa/views/GridView";

const ROWS = 4;
const COLS = 4;
const WALLS = [2, 3, 5, 11, 12, 13];
const START = 0;
const GOAL = 15;
const LABELS: Record<number, string> = { [START]: "S", [GOAL]: "G" };

const CODE = [
  "def solve(r, c):",
  "    if not open(r, c) or seen[r][c]:",
  "        return False",
  "    seen[r][c] = True            # step in",
  "    if (r, c) == GOAL:",
  "        return True              # found a path!",
  "    for dr, dc in [(0,1),(1,0),(0,-1),(-1,0)]:",
  "        if solve(r + dr, c + dc):",
  "            return True",
  "    return False                 # dead end → back up",
];

function buildMaze(): Step[] {
  const idx = (r: number, c: number) => r * COLS + c;
  const inB = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
  const open = (r: number, c: number) => inB(r, c) && !WALLS.includes(idx(r, c));
  const visited = new Set<number>();
  const dead = new Set<number>();
  const path: number[] = [];
  const steps: Step[] = [];
  let done = false;
  const snap = (extra: Partial<GridState> = {}): GridState => ({ rows: ROWS, cols: COLS, walls: WALLS, labels: LABELS, ...extra });

  steps.push({ state: snap({ caption: "find a path from S to G" }), highlight: { compare: [START] }, codeLine: 0, action: "start", narration: "Backtracking: try a path, and if it dead-ends, <b>step back</b> and try another turn.", kidNarration: "Let's find a way through the maze!" });

  const moves: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // right, down, left, up

  const dfs = (r: number, c: number) => {
    if (done) return;
    const id = idx(r, c);
    visited.add(id);
    path.push(id);
    steps.push({ state: snap({ caption: "stepping forward…" }), highlight: { active: [id], placed: path.slice(0, -1), visited: Array.from(dead) }, codeLine: 3, action: "move", narration: "Step into this cell and add it to the current path.", kidNarration: "Take a step forward." });
    if (id === GOAL) {
      done = true;
      steps.push({ state: snap({ caption: "reached G! 🎉" }), highlight: { placed: Array.from(path) }, codeLine: 5, action: "done", narration: "Reached the goal! The <b>green</b> cells are the winning path. Backtracking explores every option until one works.", kidNarration: "We made it out! 🎉" });
      return;
    }
    for (const [dr, dc] of moves) {
      const nr = r + dr;
      const nc = c + dc;
      if (open(nr, nc) && !visited.has(idx(nr, nc))) {
        dfs(nr, nc);
        if (done) return;
      }
    }
    // No move worked — backtrack.
    path.pop();
    dead.add(id);
    steps.push({ state: snap({ caption: "dead end — back up 🙂" }), highlight: { visited: Array.from(dead), placed: Array.from(path), active: path.length ? [path[path.length - 1]] : [] }, codeLine: 9, action: "back", narration: "No way forward here — <b>backtrack</b> and try a different direction.", kidNarration: "Oops, dead end! Step back and try another way." });
  };

  dfs(0, 0);
  return steps;
}

export const backtrackingModule: TopicModule = {
  slug: "backtracking",
  StructureView: GridView,
  demos: [{ key: "maze", label: "Solve the maze", emoji: "🌀", pythonCode: CODE, buildSteps: buildMaze }],
  lesson: {
    story: [
      "Imagine you're in a <b>maze</b>. 🌀 You pick a direction and walk.",
      "If you hit a dead end, you don't give up — you walk <b>back</b> to the last fork and try a different turn.",
      "You keep doing this — try, dead-end, back up, try again — until you reach the exit.",
      "Each 'back up' undoes one choice so you can explore a fresh one.",
      "…and grown-ups call this <b>Backtracking</b>!",
    ],
    steps: [
      "Make a choice and move forward (mark it as used).",
      "If it leads to a solution, great. If it dead-ends, UNDO the choice and try the next option.",
      "It's DFS with an 'undo' step — explore the whole tree of choices.",
    ],
    complexity: { time: "often exponential, e.g. O(bᵈ)", space: "O(d) for the recursion depth", note: "Pruning (cutting bad branches early) is what makes it practical." },
    edgeCases: [
      "Always UNDO your choice when you back up, or state leaks between branches.",
      "Prune impossible branches early to avoid exploring everything.",
      "Track 'visited' so you don't revisit and loop.",
    ],
    interviewTips: [
      "Clues: 'all permutations/combinations/subsets', 'N-Queens', 'Sudoku', 'word search'.",
      "Template: choose → explore (recurse) → un-choose.",
      "Backtracking = DFS over the tree of decisions.",
      "Add pruning/constraints to cut the search space dramatically.",
    ],
  },
  recall: [
    { question: "When a backtracking path dead-ends, you…", answer: "undo and try another", options: ["undo and try another", "stop completely"], explain: "You revert the last choice and explore a different option." },
    { question: "Backtracking is essentially DFS plus an 'undo' step.", answer: true, explain: "You explore deeply, then un-choose as you back out." },
    { question: "Problems asking for ALL permutations/combinations usually use…", answer: "backtracking", options: ["backtracking", "binary search"], explain: "You build each option step by step, undoing to try the rest." },
  ],
};
