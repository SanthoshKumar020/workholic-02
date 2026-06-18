"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { GridView, type GridState } from "@/components/dsa/views/GridView";

const N = 6;
const CODE = [
  "def climb(n):              # ways to climb, 1 or 2 steps",
  "    dp = [0] * (n + 1)",
  "    dp[0] = dp[1] = 1      # base cases",
  "    for i in range(2, n + 1):",
  "        dp[i] = dp[i-1] + dp[i-2]   # reuse past answers",
  "    return dp[n]",
];

function range(n: number) {
  return Array.from({ length: n }, (_, k) => k);
}

function buildClimb(): Step[] {
  const cols = N + 1;
  const dp: number[] = [];
  const labels: Record<number, string> = {};
  const G = (extra: Partial<GridState> = {}): GridState => ({ rows: 1, cols, labels: { ...labels }, ...extra });
  const steps: Step[] = [
    { state: G({ caption: `how many ways to climb ${N} stairs (1 or 2 at a time)?` }), highlight: {}, codeLine: 0, action: "start", narration: "DP fills a table of <b>small answers</b> and reuses them, so nothing is recomputed.", kidNarration: "Write each answer on a cheat sheet so we never redo it!" },
  ];
  dp[0] = 1;
  dp[1] = 1;
  labels[0] = "1";
  labels[1] = "1";
  steps.push({ state: G({ caption: "base cases: dp[0] = dp[1] = 1" }), highlight: { placed: [0, 1] }, codeLine: 2, action: "base", narration: "There's exactly 1 way to be at stair 0 or stair 1. Write those down.", kidNarration: "Stairs 0 and 1: just 1 way each." });
  for (let i = 2; i <= N; i++) {
    steps.push({ state: G({ caption: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]}` }), highlight: { active: [i], compare: [i - 1, i - 2] }, codeLine: 4, action: "compare", narration: `To reach stair ${i} you came from stair ${i - 1} or ${i - 2} — so add those two answers.`, kidNarration: `Add the last two cheat-sheet answers.` });
    dp[i] = dp[i - 1] + dp[i - 2];
    labels[i] = String(dp[i]);
    steps.push({ state: G({ caption: `dp[${i}] = ${dp[i]}` }), highlight: { placed: range(i + 1) }, codeLine: 4, action: "fill", narration: `Write <b>dp[${i}] = ${dp[i]}</b>. We'll reuse it later instead of recomputing.`, kidNarration: `Write ${dp[i]} on the sheet!` });
  }
  steps.push({ state: G({ caption: `answer: dp[${N}] = ${dp[N]}` }), highlight: { active: [N] }, codeLine: 5, action: "done", narration: `There are <b>${dp[N]}</b> ways to climb ${N} stairs. Each cell was computed once → <b>O(n)</b>.`, kidNarration: `${dp[N]} ways — and we never redid any work! 🎉` });
  return steps;
}

export const dynamicProgrammingModule: TopicModule = {
  slug: "dynamic-programming",
  StructureView: GridView,
  demos: [{ key: "climb", label: "Climbing stairs", emoji: "🪜", pythonCode: CODE, buildSteps: buildClimb }],
  lesson: {
    story: [
      "Imagine a tricky homework sheet where the same little sums appear again and again. 📝",
      "Instead of redoing each sum, you write every answer on a <b>cheat sheet</b> the first time.",
      "Next time you need it, you just read it off — instant.",
      "Dynamic programming does exactly that: solve each small subproblem once, store it, and reuse it.",
      "…and grown-ups call this <b>Dynamic Programming</b>!",
    ],
    steps: [
      "Spot overlapping subproblems (the same smaller question, over and over).",
      "Define the answer in terms of smaller answers (the recurrence).",
      "Fill a table of small answers once, then combine — no repeated work.",
    ],
    complexity: { time: "often O(n) or O(n·m)", space: "O(n) (sometimes O(1) by keeping only the last few)", note: "Beats exponential recursion by caching." },
    edgeCases: [
      "Get the base cases right — the whole table builds on them.",
      "Top-down (memoised recursion) vs bottom-up (table) give the same result.",
      "Often you can shrink space to the last 1–2 values (here, two variables).",
    ],
    interviewTips: [
      "Clues: 'count the ways', 'min/max cost', 'longest/optimal …' with overlapping choices.",
      "Write the recurrence first, then decide top-down vs bottom-up.",
      "Classics: climbing stairs, coin change, knapsack, edit distance, LIS.",
      "Greedy wrong? DP usually gives the true optimum.",
    ],
  },
  recall: [
    { question: "DP avoids recomputing by…", answer: "storing subanswers", options: ["storing subanswers", "guessing"], explain: "It caches each small answer once and reuses it — the 'cheat sheet'." },
    { question: "DP needs problems with overlapping subproblems.", answer: true, explain: "If the same smaller question recurs, caching it pays off." },
    { question: "Climbing n stairs (1 or 2 at a time) with DP is…", answer: "O(n)", options: ["O(n)", "O(2ⁿ)"], explain: "Each of the n cells is computed exactly once." },
  ],
};
