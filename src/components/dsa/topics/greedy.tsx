"use client";

import type { Step, TopicModule } from "@/lib/dsa/types";
import { ArrayView, type ArrayState } from "@/components/dsa/views/ArrayView";

const COINS = [25, 10, 5, 1];
const CODE = [
  "def make_change(amount, coins):   # coins big → small",
  "    picked = []",
  "    for coin in coins:",
  "        while coin <= amount:     # grab the biggest that fits",
  "            picked.append(coin)",
  "            amount -= coin",
  "    return picked",
];

function buildChange(): Step[] {
  let amount = 63;
  const picked: number[] = [];
  const A = (extra: Partial<ArrayState> = {}): ArrayState => ({ values: COINS, variant: "boxes", ...extra });
  const steps: Step[] = [
    { state: A({ caption: `make ${amount}¢ with the fewest coins` }), highlight: {}, codeLine: 0, action: "start", narration: `Greedy: always grab the <b>biggest coin</b> that still fits. Coins: ${COINS.join(", ")}.`, kidNarration: "Always grab the biggest cookie that fits!" },
  ];
  for (let i = 0; i < COINS.length; i++) {
    if (COINS[i] > amount) {
      if (amount > 0) {
        steps.push({ state: A({ caption: `remaining ${amount}` }), highlight: { compare: [i] }, codeLine: 2, action: "skip", narration: `${COINS[i]}¢ is bigger than the ${amount}¢ left — skip to a smaller coin.`, kidNarration: `${COINS[i]}¢ is too big — try smaller.` });
      }
      continue;
    }
    while (COINS[i] <= amount) {
      picked.push(COINS[i]);
      amount -= COINS[i];
      steps.push({ state: A({ caption: `picked: [${picked.join(", ")}]  •  remaining ${amount}` }), highlight: { active: [i] }, codeLine: 4, action: "take", narration: `Grab <b>${COINS[i]}¢</b> — the biggest that fits. ${amount}¢ to go.`, kidNarration: `Take the ${COINS[i]}¢ coin!` });
    }
  }
  steps.push({ state: A({ caption: `done: ${picked.length} coins — [${picked.join(", ")}]` }), highlight: {}, codeLine: 6, action: "done", narration: `Made 63¢ with <b>${picked.length}</b> coins. For these coins, greedy is optimal — but that's not always true!`, kidNarration: `Done with just ${picked.length} coins! 🎉` });
  return steps;
}

export const greedyModule: TopicModule = {
  slug: "greedy",
  StructureView: ArrayView,
  demos: [{ key: "coins", label: "Coin change", emoji: "🪙", pythonCode: CODE, buildSteps: buildChange }],
  lesson: {
    story: [
      "Imagine a plate of cookies of different sizes. 🍪",
      "A greedy rule says: <b>always grab the biggest cookie you can right now</b>, and don't look back.",
      "You repeat that simple choice over and over until you're done.",
      "It's fast and easy — and for many problems the greedy choice happens to give the best answer.",
      "…and grown-ups call this a <b>Greedy</b> algorithm!",
    ],
    steps: [
      "At each step make the choice that looks best <b>right now</b>.",
      "Never undo a choice (that's what makes it fast — and sometimes wrong).",
      "It works when local best choices add up to the global best (the 'greedy-choice property').",
    ],
    complexity: { time: "usually O(n) or O(n log n) after sorting", space: "O(1)–O(n)", note: "Fast, but you must PROVE it's optimal for your problem." },
    edgeCases: [
      "Greedy can fail! Coins [1, 3, 4] making 6: greedy gives 4+1+1=3 coins, optimal is 3+3=2.",
      "Many greedy problems need the input sorted first.",
      "If greedy is wrong, dynamic programming usually gives the true optimum.",
    ],
    interviewTips: [
      "Always argue WHY the greedy choice is safe (exchange argument).",
      "Classics: interval scheduling, Huffman coding, Dijkstra, fractional knapsack.",
      "If you can find a counter-example, switch to DP.",
      "Sorting first is a common greedy setup.",
    ],
  },
  recall: [
    { question: "A greedy algorithm picks…", answer: "the best choice right now", options: ["the best choice right now", "every possible choice"], explain: "It commits to the locally-best option at each step and never looks back." },
    { question: "Greedy always gives the optimal answer.", answer: false, explain: "Only when the greedy-choice property holds — otherwise it can be wrong." },
    { question: "If greedy gives a wrong answer, a good fallback is…", answer: "dynamic programming", options: ["dynamic programming", "binary search"], explain: "DP explores overlapping subproblems to find the true optimum." },
  ],
};
