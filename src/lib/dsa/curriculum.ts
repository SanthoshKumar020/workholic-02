// The DSA Adventure curriculum — a journey of islands.
// Each island shows a kid-friendly name + the real technical name.

export interface Island {
  slug: string;
  /** Playful name shown big on the map. */
  kidName: string;
  /** The real CS term, revealed after the idea lands. */
  techName: string;
  emoji: string;
  /** One friendly line for the map card. */
  blurb: string;
  /** The exact kid-friendly analogy from the analogy library. */
  analogy: string;
  /** Slugs that must be mastered first. */
  prereqs: string[];
  /** First few islands are free; the rest are Pro. */
  free: boolean;
  /** True once a real lesson module exists (vs a "coming soon" stub). */
  built: boolean;
  /** Tailwind gradient classes for the island card. */
  gradient: string;
}

export const ISLANDS: Island[] = [
  {
    slug: "big-o",
    kidName: "Counting Time",
    techName: "Big-O & Complexity",
    emoji: "⏱️",
    blurb: "If you had 1000× more candy, how much longer would it take?",
    analogy: "Counting candy one-by-one vs weighing it all at once.",
    prereqs: [],
    free: true,
    built: true,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    slug: "arrays-strings",
    kidName: "Lockers",
    techName: "Arrays & Strings",
    emoji: "🔢",
    blurb: "A row of numbered school lockers — go straight to any one.",
    analogy: "An egg carton / a row of numbered lockers.",
    prereqs: ["big-o"],
    free: true,
    built: true,
    gradient: "from-sky-400 to-blue-500",
  },
  {
    slug: "two-pointers",
    kidName: "Walk Together",
    techName: "Two Pointers",
    emoji: "🧍↔️🧍",
    blurb: "Two friends walk in from both ends and meet in the middle.",
    analogy: "Two friends starting at opposite ends, walking toward each other.",
    prereqs: ["arrays-strings"],
    free: false,
    built: true,
    gradient: "from-indigo-400 to-blue-600",
  },
  {
    slug: "sliding-window",
    kidName: "Train Window",
    techName: "Sliding Window",
    emoji: "🪟",
    blurb: "A window on a train sliding past the seats, k at a time.",
    analogy: "A train window sliding along the seats — add the new one, drop the old one.",
    prereqs: ["two-pointers"],
    free: false,
    built: true,
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    slug: "linked-lists",
    kidName: "Treasure Hunt",
    techName: "Linked Lists",
    emoji: "🗺️",
    blurb: "Each clue tells you where the next clue is hidden.",
    analogy: "A treasure hunt: each clue points to the next clue.",
    prereqs: ["arrays-strings"],
    free: true,
    built: true,
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    slug: "stacks-queues",
    kidName: "Plates & Lines",
    techName: "Stacks & Queues",
    emoji: "🍽️",
    blurb: "A stack of plates, and the line at the ice-cream truck.",
    analogy: "Stack = plates (last on, first off). Queue = ice-cream line (first in, first served).",
    prereqs: ["linked-lists"],
    free: false,
    built: true,
    gradient: "from-fuchsia-500 to-violet-600",
  },
  {
    slug: "hash-maps",
    kidName: "Coat-Check",
    techName: "Hash Maps",
    emoji: "🎟️",
    blurb: "Give a ticket, get your coat back instantly.",
    analogy: "A coat-check counter: a ticket (key) fetches your coat (value).",
    prereqs: ["arrays-strings"],
    free: false,
    built: true,
    gradient: "from-rose-400 to-pink-500",
  },
  {
    slug: "recursion",
    kidName: "Nesting Dolls",
    techName: "Recursion",
    emoji: "🪆",
    blurb: "A doll inside a doll inside a doll…",
    analogy: "Russian nesting dolls / two mirrors facing each other.",
    prereqs: ["stacks-queues"],
    free: false,
    built: true,
    gradient: "from-purple-400 to-indigo-500",
  },
  {
    slug: "trees-bst",
    kidName: "Family Trees",
    techName: "Trees & BST",
    emoji: "🌳",
    blurb: "Smaller goes left, bigger goes right.",
    analogy: "Sorting toys: smaller goes left, bigger goes right.",
    prereqs: ["recursion"],
    free: false,
    built: true,
    gradient: "from-green-400 to-emerald-600",
  },
  {
    slug: "tree-traversals",
    kidName: "House Tour",
    techName: "Tree Traversals",
    emoji: "🏠",
    blurb: "Visit every room in the house, in order.",
    analogy: "Walking through every room in a house.",
    prereqs: ["trees-bst"],
    free: false,
    built: true,
    gradient: "from-lime-400 to-green-500",
  },
  {
    slug: "graphs",
    kidName: "Town Map",
    techName: "Graphs (BFS & DFS)",
    emoji: "🛣️",
    blurb: "Towns joined by roads — and how to explore them.",
    analogy: "A map of towns joined by roads; BFS = ripples in a pond, DFS = a maze.",
    prereqs: ["trees-bst"],
    free: false,
    built: true,
    gradient: "from-cyan-400 to-sky-600",
  },
  {
    slug: "binary-search",
    kidName: "Guess the Number",
    techName: "Binary Search",
    emoji: "🔍",
    blurb: "Higher or lower? Halve the guesses every time.",
    analogy: "The 'guess my number — higher or lower?' game.",
    prereqs: ["arrays-strings"],
    free: false,
    built: true,
    gradient: "from-teal-400 to-cyan-600",
  },
  {
    slug: "sorting",
    kidName: "Line Them Up",
    techName: "Sorting",
    emoji: "📊",
    blurb: "Line up friends from shortest to tallest.",
    analogy: "Lining up friends from shortest to tallest.",
    prereqs: ["binary-search"],
    free: false,
    built: true,
    gradient: "from-orange-400 to-red-500",
  },
  {
    slug: "heaps",
    kidName: "Champions",
    techName: "Heaps",
    emoji: "🏆",
    blurb: "The champion floats to the top of the bracket.",
    analogy: "A tournament bracket: the champion floats to the top.",
    prereqs: ["trees-bst"],
    free: false,
    built: true,
    gradient: "from-yellow-400 to-amber-600",
  },
  {
    slug: "backtracking",
    kidName: "Maze Paths",
    techName: "Backtracking",
    emoji: "🌀",
    blurb: "Try a path, and step back when you're stuck.",
    analogy: "Trying maze paths and stepping back when stuck.",
    prereqs: ["recursion"],
    free: false,
    built: true,
    gradient: "from-indigo-400 to-purple-600",
  },
  {
    slug: "greedy",
    kidName: "Biggest Cookie",
    techName: "Greedy",
    emoji: "🍪",
    blurb: "Always grab the biggest cookie right now.",
    analogy: "Always grabbing the biggest cookie available.",
    prereqs: ["sorting"],
    free: false,
    built: true,
    gradient: "from-amber-500 to-yellow-600",
  },
  {
    slug: "dynamic-programming",
    kidName: "Cheat Sheet",
    techName: "Dynamic Programming",
    emoji: "📝",
    blurb: "Write answers down so you never redo them.",
    analogy: "Keeping a cheat sheet so you never solve the same thing twice.",
    prereqs: ["recursion"],
    free: false,
    built: true,
    gradient: "from-violet-400 to-fuchsia-600",
  },
  {
    slug: "tries",
    kidName: "Autocomplete",
    techName: "Tries",
    emoji: "🔤",
    blurb: "How your phone finishes words for you.",
    analogy: "Phone autocomplete / a dictionary tree.",
    prereqs: ["trees-bst"],
    free: false,
    built: true,
    gradient: "from-pink-400 to-rose-600",
  },
];

export function getIsland(slug: string): Island | undefined {
  return ISLANDS.find((i) => i.slug === slug);
}

/** How many islands are free for the free tier. */
export const FREE_ISLAND_COUNT = ISLANDS.filter((i) => i.free).length;

/**
 * An island is unlocked when every *built* prerequisite is mastered.
 * Unbuilt prereqs are ignored so the journey is playable as we ship islands.
 * The very first island is always open.
 */
export function isIslandUnlocked(
  island: Island,
  masteredSlugs: Set<string>,
  islands: Island[] = ISLANDS,
): boolean {
  if (island.prereqs.length === 0) return true;
  const builtPrereqs = island.prereqs.filter(
    (slug) => islands.find((i) => i.slug === slug)?.built,
  );
  if (builtPrereqs.length === 0) return true; // nothing buildable to gate on yet
  return builtPrereqs.every((slug) => masteredSlugs.has(slug));
}
