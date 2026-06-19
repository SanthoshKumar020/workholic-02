"use client";

import { useRef, useState } from "react";
import { Play, Loader2, Check, XCircle, RotateCcw } from "lucide-react";
import { runPython, type RunOutcome, type TestCase } from "@/components/dsa/usePyodide";
import { cn } from "@/lib/utils";

export function CodeRunner({
  starter,
  functionName,
  tests,
  onAllPass,
}: {
  starter: string;
  functionName?: string;
  tests?: TestCase[];
  onAllPass?: () => void;
}) {
  const [code, setCode] = useState(starter);
  const [status, setStatus] = useState<"idle" | "booting" | "running" | "done">("idle");
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const booted = useRef(false);

  async function run() {
    setOutcome(null);
    setStatus(booted.current ? "running" : "booting");
    const res = await runPython(code, functionName, tests);
    booted.current = true;
    setStatus("done");
    setOutcome(res);
    if (res.ok && tests && tests.length) onAllPass?.();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const nv = code.slice(0, start) + "    " + code.slice(end);
      setCode(nv);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4;
      });
    }
  }

  const passCount = outcome?.results?.filter((r) => r.ok).length ?? 0;
  const total = outcome?.results?.length ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="font-mono text-xs text-slate-400">solution.py — runs in your browser</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { setCode(starter); setOutcome(null); setStatus("idle"); }} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            onClick={run}
            disabled={status === "booting" || status === "running"}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {status === "booting" || status === "running" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {status === "booting" ? "Loading Python…" : status === "running" ? "Running…" : "Run"}
          </button>
        </div>
      </div>

      <textarea
        ref={taRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        rows={Math.max(6, code.split("\n").length + 1)}
        className="w-full resize-y bg-slate-900 p-3 font-mono text-[13px] leading-relaxed text-slate-100 outline-none"
        aria-label="Python code editor"
      />

      {status === "booting" && (
        <div className="border-t border-white/10 px-3 py-2 text-xs text-slate-400">
          First run downloads Python (~once). This can take a few seconds…
        </div>
      )}

      {outcome && (
        <div className="border-t border-white/10 p-3 text-xs">
          {outcome.error ? (
            <pre className="whitespace-pre-wrap font-mono text-rose-300">⚠️ {outcome.error}</pre>
          ) : (
            <>
              {tests && tests.length > 0 && (
                <div className={cn("mb-2 flex items-center gap-1.5 font-bold", passCount === total ? "text-emerald-400" : "text-amber-300")}>
                  {passCount === total ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {passCount}/{total} tests passed{passCount === total ? " — nice! 🎉" : ""}
                </div>
              )}
              <div className="space-y-1">
                {outcome.results?.map((r, i) => (
                  <div key={i} className={cn("flex items-start gap-2 font-mono", r.ok ? "text-emerald-300" : "text-rose-300")}>
                    {r.ok ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    <span>
                      Test {i + 1}: {r.ok ? "passed" : r.error ? `error — ${r.error}` : `got ${JSON.stringify(r.got)}, expected ${JSON.stringify(r.expected)}`}
                    </span>
                  </div>
                ))}
              </div>
              {outcome.stdout && (
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-black/30 p-2 font-mono text-slate-300">{outcome.stdout}</pre>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
