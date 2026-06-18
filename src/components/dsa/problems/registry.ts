import type { DsaProblem } from "@/lib/dsa/types";
import { twoPointersProblems } from "@/components/dsa/problems/two-pointers";

/**
 * Curated problem banks per topic. AI top-up generates more at runtime to
 * reach the per-topic goal, so this only needs the high-quality seed set.
 */
export const PROBLEM_BANKS: Record<string, DsaProblem[]> = {
  "two-pointers": twoPointersProblems,
};

export function getProblems(slug: string): DsaProblem[] {
  return PROBLEM_BANKS[slug] ?? [];
}

/** The aspirational per-topic goal shown on the progress bar. */
export const PROBLEM_GOAL = 100;
