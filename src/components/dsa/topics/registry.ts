import type { TopicModule } from "@/lib/dsa/types";
import { stacksQueuesModule } from "@/components/dsa/topics/stacks-queues";

/**
 * Registry of built topic modules. Adding a new data structure = write one
 * module file and register it here — no changes to the player or pages.
 */
export const TOPIC_MODULES: Record<string, TopicModule> = {
  "stacks-queues": stacksQueuesModule,
};

export function getTopicModule(slug: string): TopicModule | undefined {
  return TOPIC_MODULES[slug];
}
