"use client";

import type { Step, StructureViewProps, TopicModule } from "@/lib/dsa/types";

interface TrieNodeT {
  id: number;
  char: string;
  children: number[];
  isEnd: boolean;
}
interface TrieState {
  nodes: TrieNodeT[];
  root: number;
  pointers?: Record<string, number>;
  caption?: string;
}

const FILL: Record<string, string> = { active: "#8b5cf6", compare: "#38bdf8", placed: "#34d399", visited: "#a5b4fc", rest: "#ffffff" };
const TXT: Record<string, string> = { active: "#fff", compare: "#075985", placed: "#065f46", visited: "#3730a3", rest: "#334155" };
function roleOf(id: number, h: StructureViewProps["highlight"]) {
  if (h.active?.includes(id)) return "active";
  if (h.compare?.includes(id)) return "compare";
  if (h.placed?.includes(id)) return "placed";
  if (h.visited?.includes(id)) return "visited";
  return "rest";
}

function TrieView({ state, highlight }: StructureViewProps) {
  const s = state as TrieState;
  const byId = new Map(s.nodes.map((n) => [n.id, n]));
  const pos = new Map<number, { x: number; y: number }>();
  let slot = 0;
  let maxDepth = 0;
  const layout = (id: number, depth: number) => {
    const n = byId.get(id);
    if (!n) return;
    maxDepth = Math.max(maxDepth, depth);
    if (n.children.length === 0) {
      pos.set(id, { x: slot, y: depth });
      slot++;
      return;
    }
    const xs: number[] = [];
    for (const c of n.children) {
      layout(c, depth + 1);
      const p = pos.get(c);
      if (p) xs.push(p.x);
    }
    pos.set(id, { x: xs.reduce((a, b) => a + b, 0) / xs.length, y: depth });
  };
  layout(s.root, 0);

  const GAPX = 46;
  const GAPY = 62;
  const R = 18;
  const PAD = 22;
  const width = PAD * 2 + Math.max(slot, 1) * GAPX;
  const height = PAD * 2 + (maxDepth + 1) * GAPY;
  const px = (x: number) => PAD + x * GAPX + R;
  const py = (y: number) => PAD + y * GAPY + R;

  const pointersAt: Record<number, string[]> = {};
  for (const [label, id] of Object.entries(s.pointers ?? {})) (pointersAt[id] ??= []).push(label);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="max-w-full" style={{ height: Math.min(height, 300) }}>
        {s.nodes.map((n) =>
          n.children.map((c) => {
            const a = pos.get(n.id);
            const b = pos.get(c);
            if (!a || !b) return null;
            return <line key={`${n.id}-${c}`} x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)} stroke="#cbd5e1" strokeWidth={2} />;
          }),
        )}
        {s.nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          const role = roleOf(n.id, highlight);
          return (
            <g key={n.id}>
              {(pointersAt[n.id] ?? []).length > 0 && (
                <text x={px(p.x)} y={py(p.y) - R - 5} textAnchor="middle" className="fill-violet-700 text-[10px] font-extrabold">
                  {pointersAt[n.id].join(",")}
                </text>
              )}
              {n.isEnd && <circle cx={px(p.x)} cy={py(p.y)} r={R + 3} fill="none" stroke="#34d399" strokeWidth={2} />}
              <circle cx={px(p.x)} cy={py(p.y)} r={R} fill={FILL[role]} stroke={role === "rest" ? "#94a3b8" : FILL[role]} strokeWidth={2} />
              <text x={px(p.x)} y={py(p.y) + 5} textAnchor="middle" fill={TXT[role]} className="text-[13px] font-bold">
                {n.char || "•"}
              </text>
            </g>
          );
        })}
      </svg>
      {s.caption && <p className="text-center text-sm font-bold text-slate-600">{s.caption}</p>}
    </div>
  );
}

const WORDS = ["cat", "car", "dog"];
const INSERT_CODE = [
  "class TrieNode:",
  "    def __init__(self):",
  "        self.children = {}",
  "        self.end = False",
  "def insert(root, word):",
  "    node = root",
  "    for ch in word:",
  "        if ch not in node.children:",
  "            node.children[ch] = TrieNode()   # new branch",
  "        node = node.children[ch]",
  "    node.end = True",
];
const SEARCH_CODE = [
  "def autocomplete(root, prefix):",
  "    node = root",
  "    for ch in prefix:",
  "        if ch not in node.children: return []",
  "        node = node.children[ch]",
  "    return all_words_below(node, prefix)",
];

function freshTrie() {
  const nodes: TrieNodeT[] = [{ id: 0, char: "", children: [], isEnd: false }];
  let nextId = 1;
  const childWith = (id: number, ch: string) => nodes[id].children.find((c) => nodes[c].char === ch);
  const add = (parent: number, ch: string) => {
    const id = nextId++;
    nodes.push({ id, char: ch, children: [], isEnd: false });
    nodes[parent].children.push(id);
    return id;
  };
  return { nodes, childWith, add };
}

function buildInsert(): Step[] {
  const t = freshTrie();
  const snap = (extra: Partial<TrieState> = {}): TrieState => ({ nodes: t.nodes.map((n) => ({ ...n, children: [...n.children] })), root: 0, ...extra });
  const steps: Step[] = [{ state: snap({ caption: `insert: ${WORDS.join(", ")}` }), highlight: {}, codeLine: 4, action: "start", narration: "A trie stores words letter by letter. Shared prefixes share branches.", kidNarration: "Build a word-tree, one letter at a time!" }];
  for (const word of WORDS) {
    let curr = 0;
    for (const ch of word) {
      const existing = t.childWith(curr, ch);
      if (existing != null) {
        steps.push({ state: snap({ pointers: { node: existing }, caption: `"${word}": reuse '${ch}'` }), highlight: { compare: [existing] }, codeLine: 9, action: "reuse", narration: `'${ch}' already branches from here — <b>reuse</b> it (shared prefix).`, kidNarration: `'${ch}' is already here — share it!` });
        curr = existing;
      } else {
        const id = t.add(curr, ch);
        steps.push({ state: snap({ pointers: { node: id }, caption: `"${word}": add '${ch}'` }), highlight: { active: [id] }, codeLine: 8, action: "add", narration: `Add a new branch for '${ch}'.`, kidNarration: `Add '${ch}'.` });
        curr = id;
      }
    }
    t.nodes[curr].isEnd = true;
    steps.push({ state: snap({ caption: `"${word}" stored ✓` }), highlight: { placed: [curr] }, codeLine: 10, action: "end", narration: `Mark this node as the <b>end</b> of "${word}" (green ring).`, kidNarration: `"${word}" is complete! ✓` });
  }
  steps.push({ state: snap({ caption: "trie built — 'ca' is shared by cat & car" }), highlight: {}, codeLine: 10, action: "done", narration: "Notice <b>cat</b> and <b>car</b> share the 'c-a' path. Tries save space and make prefix search fast.", kidNarration: "cat and car share the start — neat! 🎉" });
  return steps;
}

function buildAutocomplete(): Step[] {
  const t = freshTrie();
  for (const word of WORDS) {
    let curr = 0;
    for (const ch of word) {
      const existing = t.childWith(curr, ch);
      curr = existing != null ? existing : t.add(curr, ch);
    }
    t.nodes[curr].isEnd = true;
  }
  const snap = (extra: Partial<TrieState> = {}): TrieState => ({ nodes: t.nodes, root: 0, ...extra });
  const prefix = "ca";
  const steps: Step[] = [{ state: snap({ caption: `autocomplete "${prefix}"` }), highlight: {}, codeLine: 0, action: "start", narration: `Type <b>"${prefix}"</b> — walk down that path, then list everything below it.`, kidNarration: `Type "ca" and see what pops up!` }];
  let curr = 0;
  const path: number[] = [];
  for (const ch of prefix) {
    const next = t.childWith(curr, ch)!;
    path.push(next);
    steps.push({ state: snap({ pointers: { node: next }, caption: `matched '${ch}'` }), highlight: { active: [next], visited: path.slice(0, -1) }, codeLine: 4, action: "walk", narration: `Follow '${ch}'.`, kidNarration: `Go to '${ch}'.` });
    curr = next;
  }
  // Collect all end-words below curr.
  const found: string[] = [];
  const sub: number[] = [];
  const collect = (id: number, acc: string) => {
    const n = t.nodes[id];
    if (id !== curr) sub.push(id);
    if (n.isEnd) found.push(acc);
    for (const c of n.children) collect(c, acc + t.nodes[c].char);
  };
  collect(curr, prefix);
  steps.push({ state: snap({ pointers: { node: curr }, caption: `suggestions: ${found.join(", ")}` }), highlight: { placed: sub, active: [curr] }, codeLine: 5, action: "done", narration: `Everything below "${prefix}" completes it: <b>${found.join(", ")}</b>. That's how autocomplete works!`, kidNarration: `It suggests: ${found.join(", ")}! 🎉` });
  return steps;
}

export const triesModule: TopicModule = {
  slug: "tries",
  StructureView: TrieView,
  demos: [
    { key: "insert", label: "Build the trie", emoji: "🌱", pythonCode: INSERT_CODE, buildSteps: buildInsert },
    { key: "auto", label: "Autocomplete", emoji: "🔮", pythonCode: SEARCH_CODE, buildSteps: buildAutocomplete },
  ],
  lesson: {
    story: [
      "Think about how your phone <b>finishes words</b> as you type. 🔮",
      "Type 'c', then 'a', and it already guesses 'cat', 'car'…",
      "A trie is a tree of letters: each path from the top spells out a word.",
      "Words that start the same <b>share</b> the same beginning branch — so prefixes are super fast to find.",
      "…and grown-ups call this a <b>Trie</b> (prefix tree)!",
    ],
    steps: [
      "Each node is one character; a path from the root spells a prefix.",
      "Shared prefixes share branches (cat & car share 'c-a').",
      "Lookup/insert is O(length of the word), independent of how many words you stored.",
    ],
    complexity: { time: "insert/search O(L), L = word length", space: "O(total characters)", note: "Prefix queries are the superpower." },
    edgeCases: [
      "Mark end-of-word nodes, or you can't tell 'car' from a prefix of 'card'.",
      "Memory can be large; compress with a radix/Patricia trie if needed.",
      "Case-sensitivity and alphabet size affect the children map.",
    ],
    interviewTips: [
      "Clues: 'autocomplete', 'prefix search', 'dictionary of words', 'word search II'.",
      "Trie beats a hash set when you need PREFIX queries, not just exact lookup.",
      "Search time depends on word length, not the number of words.",
      "Pair a trie with DFS for word-grid problems.",
    ],
  },
  recall: [
    { question: "A trie is especially good at…", answer: "prefix search", options: ["prefix search", "sorting numbers"], explain: "Shared branches make 'starts with…' queries fast — that's autocomplete." },
    { question: "In a trie, words with the same start share the same branch.", answer: true, explain: "'cat' and 'car' share the 'c-a' path — that saves space." },
    { question: "Searching a word in a trie takes time proportional to…", answer: "the word's length", options: ["the word's length", "the number of words"], explain: "You walk one node per character, regardless of how many words exist." },
  ],
};
