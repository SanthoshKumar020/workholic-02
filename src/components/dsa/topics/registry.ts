import type { TopicModule } from "@/lib/dsa/types";
import { bigOModule } from "@/components/dsa/topics/big-o";
import { arraysStringsModule } from "@/components/dsa/topics/arrays-strings";
import { twoPointersModule } from "@/components/dsa/topics/two-pointers";
import { slidingWindowModule } from "@/components/dsa/topics/sliding-window";
import { linkedListsModule } from "@/components/dsa/topics/linked-lists";
import { stacksQueuesModule } from "@/components/dsa/topics/stacks-queues";
import { binarySearchModule } from "@/components/dsa/topics/binary-search";
import { sortingModule } from "@/components/dsa/topics/sorting";
import { treesBstModule } from "@/components/dsa/topics/trees-bst";
import { treeTraversalsModule } from "@/components/dsa/topics/tree-traversals";
import { heapsModule } from "@/components/dsa/topics/heaps";
import { graphsModule } from "@/components/dsa/topics/graphs";
import { backtrackingModule } from "@/components/dsa/topics/backtracking";
import { hashMapsModule } from "@/components/dsa/topics/hash-maps";
import { recursionModule } from "@/components/dsa/topics/recursion";
import { greedyModule } from "@/components/dsa/topics/greedy";
import { dynamicProgrammingModule } from "@/components/dsa/topics/dynamic-programming";
import { triesModule } from "@/components/dsa/topics/tries";

/**
 * Registry of built topic modules. Adding a new data structure = write one
 * module file and register it here — no changes to the player or pages.
 */
export const TOPIC_MODULES: Record<string, TopicModule> = {
  "big-o": bigOModule,
  "arrays-strings": arraysStringsModule,
  "two-pointers": twoPointersModule,
  "sliding-window": slidingWindowModule,
  "linked-lists": linkedListsModule,
  "stacks-queues": stacksQueuesModule,
  "binary-search": binarySearchModule,
  sorting: sortingModule,
  "trees-bst": treesBstModule,
  "tree-traversals": treeTraversalsModule,
  heaps: heapsModule,
  graphs: graphsModule,
  backtracking: backtrackingModule,
  "hash-maps": hashMapsModule,
  recursion: recursionModule,
  greedy: greedyModule,
  "dynamic-programming": dynamicProgrammingModule,
  tries: triesModule,
};

export function getTopicModule(slug: string): TopicModule | undefined {
  return TOPIC_MODULES[slug];
}
