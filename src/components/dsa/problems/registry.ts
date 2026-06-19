import type { DsaProblem } from "@/lib/dsa/types";
import { twoPointersProblems } from "@/components/dsa/problems/two-pointers";
import { arraysStringsProblems } from "@/components/dsa/problems/arrays-strings";
import { slidingWindowProblems } from "@/components/dsa/problems/sliding-window";
import { binarySearchProblems } from "@/components/dsa/problems/binary-search";
import { sortingProblems } from "@/components/dsa/problems/sorting";
import { linkedListsProblems } from "@/components/dsa/problems/linked-lists";
import { stacksQueuesProblems } from "@/components/dsa/problems/stacks-queues";
import { hashMapsProblems } from "@/components/dsa/problems/hash-maps";
import { recursionProblems } from "@/components/dsa/problems/recursion";
import { treesBstProblems } from "@/components/dsa/problems/trees-bst";
import { treeTraversalsProblems } from "@/components/dsa/problems/tree-traversals";
import { graphsProblems } from "@/components/dsa/problems/graphs";
import { heapsProblems } from "@/components/dsa/problems/heaps";
import { backtrackingProblems } from "@/components/dsa/problems/backtracking";
import { greedyProblems } from "@/components/dsa/problems/greedy";
import { dynamicProgrammingProblems } from "@/components/dsa/problems/dynamic-programming";
import { triesProblems } from "@/components/dsa/problems/tries";

/**
 * Curated problem banks per topic. AI top-up generates more at runtime to
 * reach the per-topic goal, so this only needs the high-quality seed set.
 */
export const PROBLEM_BANKS: Record<string, DsaProblem[]> = {
  "arrays-strings": arraysStringsProblems,
  "two-pointers": twoPointersProblems,
  "sliding-window": slidingWindowProblems,
  "binary-search": binarySearchProblems,
  sorting: sortingProblems,
  "linked-lists": linkedListsProblems,
  "stacks-queues": stacksQueuesProblems,
  "hash-maps": hashMapsProblems,
  recursion: recursionProblems,
  "trees-bst": treesBstProblems,
  "tree-traversals": treeTraversalsProblems,
  graphs: graphsProblems,
  heaps: heapsProblems,
  backtracking: backtrackingProblems,
  greedy: greedyProblems,
  "dynamic-programming": dynamicProgrammingProblems,
  tries: triesProblems,
};

export function getProblems(slug: string): DsaProblem[] {
  return PROBLEM_BANKS[slug] ?? [];
}

/** The aspirational per-topic goal shown on the progress bar. */
export const PROBLEM_GOAL = 100;
