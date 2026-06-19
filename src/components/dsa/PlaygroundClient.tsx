"use client";

import { useState } from "react";
import { CodeRunner } from "@/components/dsa/CodeRunner";
import { BitSays } from "@/components/dsa/Mascot";

const SAMPLES: { label: string; code: string }[] = [
  { label: "Hello", code: 'print("Hello from Python in your browser! 🐍")' },
  {
    label: "Fibonacci",
    code: "def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        print(a, end=' ')\n        a, b = b, a + b\n\nfib(10)",
  },
  {
    label: "Two pointers",
    code: "def reverse(arr):\n    l, r = 0, len(arr) - 1\n    while l < r:\n        arr[l], arr[r] = arr[r], arr[l]\n        l, r = l + 1, r - 1\n    return arr\n\nprint(reverse([1, 2, 3, 4, 5]))",
  },
];

export function PlaygroundClient() {
  const [starter, setStarter] = useState(SAMPLES[0].code);
  const [key, setKey] = useState(0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BitSays mood="happy">
        This is your sandbox 🧪 — write any Python and press <b>Run</b>. It runs entirely in your browser, free. Try a sample below!
      </BitSays>

      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            onClick={() => {
              setStarter(s.code);
              setKey((k) => k + 1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      <CodeRunner key={key} starter={starter} />
    </div>
  );
}
