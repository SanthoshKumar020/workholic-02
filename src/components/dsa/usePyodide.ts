"use client";

// Lazy, cached Pyodide loader. Runs Python fully in the browser (WASM) — no
// server, no cost. The heavy download happens once on first "Run", then caches.

const PY_VERSION = "0.26.4";
const BASE = `https://cdn.jsdelivr.net/pyodide/v${PY_VERSION}/full/`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PyodideInstance = any;

let pyodidePromise: Promise<PyodideInstance> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-pyodide]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.pyodide = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Pyodide"));
    document.head.appendChild(s);
  });
}

/** Returns a ready Pyodide instance, loading it once and caching the promise. */
export function getPyodide(): Promise<PyodideInstance> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(`${BASE}pyodide.js`);
      // @ts-expect-error injected by the CDN script
      const py = await window.loadPyodide({ indexURL: BASE });
      return py;
    })();
  }
  return pyodidePromise;
}

export interface TestCase {
  args: unknown[];
  expected: unknown;
}
export interface TestResult {
  ok: boolean;
  got?: unknown;
  expected: unknown;
  error?: string;
}
export interface RunOutcome {
  ok: boolean;
  stdout: string;
  /** Present when tests were supplied. */
  results?: TestResult[];
  /** Top-level error (syntax/runtime before tests ran). */
  error?: string;
}

const PY_STR = (s: string) => "r'''" + s.replace(/'''/g, "'' '") + "'''";

/** Run user code; if `tests` given, call `functionName` against each case. */
export async function runPython(code: string, functionName?: string, tests?: TestCase[]): Promise<RunOutcome> {
  const py = await getPyodide();

  if (!tests || tests.length === 0 || !functionName) {
    const harness = [
      "import sys, io, json",
      "_o = io.StringIO(); sys.stdout = _o",
      "try:",
      ...code.split("\n").map((l) => "    " + l),
      "    _err = None",
      "except Exception as _e:",
      "    _err = str(_e)",
      "finally:",
      "    sys.stdout = sys.__stdout__",
      "json.dumps({'stdout': _o.getvalue(), 'error': _err})",
    ].join("\n");
    try {
      const raw = py.runPython(harness);
      const parsed = JSON.parse(raw);
      return { ok: !parsed.error, stdout: parsed.stdout ?? "", error: parsed.error ?? undefined };
    } catch (e) {
      return { ok: false, stdout: "", error: e instanceof Error ? e.message : String(e) };
    }
  }

  const testsJson = JSON.stringify(tests.map((t) => ({ args: t.args, expected: t.expected })));
  const harness = [
    "import sys, io, json",
    "_o = io.StringIO(); sys.stdout = _o",
    "_top_err = None",
    "_results = []",
    "try:",
    ...code.split("\n").map((l) => "    " + l),
    "    _tests = json.loads(" + PY_STR(testsJson) + ")",
    "    for _t in _tests:",
    "        try:",
    `            _r = ${functionName}(*_t['args'])`,
    "            _results.append({'ok': _r == _t['expected'], 'got': _r, 'expected': _t['expected']})",
    "        except Exception as _e:",
    "            _results.append({'ok': False, 'error': str(_e), 'expected': _t['expected']})",
    "except Exception as _e:",
    "    _top_err = str(_e)",
    "finally:",
    "    sys.stdout = sys.__stdout__",
    "json.dumps({'stdout': _o.getvalue(), 'error': _top_err, 'results': _results})",
  ].join("\n");

  try {
    const raw = py.runPython(harness);
    const parsed = JSON.parse(raw);
    const results: TestResult[] = parsed.results ?? [];
    return {
      ok: !parsed.error && results.length > 0 && results.every((r) => r.ok),
      stdout: parsed.stdout ?? "",
      results,
      error: parsed.error ?? undefined,
    };
  } catch (e) {
    return { ok: false, stdout: "", error: e instanceof Error ? e.message : String(e) };
  }
}
