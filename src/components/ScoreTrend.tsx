import Link from "next/link";

/**
 * ATS score over time.
 *
 * Every `enhance` run inserts a `resumes` row with `ats_score` and
 * `created_at`, so "61 → 84 over three weeks" has always been derivable — and
 * was never shown anywhere. Scores appeared only as a per-card ring, and free
 * users couldn't see the list at all.
 *
 * That was backwards on two counts. Proof of improvement is the single thing a
 * resume tool exists to demonstrate, and hiding it from free users hid the
 * exact evidence that would justify upgrading. The trend is now visible to
 * everyone; Pro still gates the full history and re-downloads.
 *
 * Rendered as an inline SVG sparkline — no chart library, no client JS.
 */

export type ScorePoint = { score: number; at: string };

function color(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#6366f1";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export function ScoreTrend({ points }: { points: ScorePoint[] }) {
  // Oldest → newest, and only entries that actually have a score.
  const data = points
    .filter((p) => typeof p.score === "number")
    .slice()
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  // A single point is not a trend; say so honestly rather than drawing a
  // flat line that implies stagnation.
  if (data.length < 2) {
    const only = data[0];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Your ATS score over time</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          {only
            ? `Your first resume scored ${only.score}/100. Enhance it again after making changes and this becomes a trend line you can watch climb.`
            : "Once you enhance a resume, your score history appears here."}
        </p>
        <Link
          href="/builder"
          className="mt-4 inline-block rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          {only ? "Improve it again" : "Enhance a resume"}
        </Link>
      </div>
    );
  }

  const first = data[0].score;
  const latest = data[data.length - 1].score;
  const delta = latest - first;
  const best = Math.max(...data.map((d) => d.score));

  // Geometry — fixed viewBox, scaled by CSS so it stays responsive.
  const W = 600;
  const H = 140;
  const PAD = 12;
  const min = Math.max(0, Math.min(...data.map((d) => d.score)) - 8);
  const max = Math.min(100, best + 8);
  const span = Math.max(1, max - min);

  const xy = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.score - min) / span) * (H - PAD * 2);
    return { x, y, ...d };
  });

  const line = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${xy[xy.length - 1].x.toFixed(1)},${H - PAD} L${xy[0].x.toFixed(1)},${H - PAD} Z`;
  const stroke = color(latest);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Your ATS score over time</h2>
        <p className="text-xs text-slate-400">{data.length} versions</p>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="text-3xl font-extrabold leading-none" style={{ color: stroke }}>
            {latest}
          </p>
          <p className="mt-1 text-xs text-slate-400">Latest</p>
        </div>
        <div>
          <p
            className={`text-lg font-bold leading-none ${
              delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-slate-400"
            }`}
          >
            {delta > 0 ? `+${delta}` : delta}
          </p>
          <p className="mt-1 text-xs text-slate-400">Since your first</p>
        </div>
        <div>
          <p className="text-lg font-bold leading-none text-slate-700">{best}</p>
          <p className="mt-1 text-xs text-slate-400">Best</p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 h-32 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`ATS score trend: started at ${first}, now ${latest} out of 100`}
      >
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#scoreFill)" />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {xy.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === xy.length - 1 ? 5 : 3}
            fill="#fff"
            stroke={stroke}
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {delta > 0
          ? `Up ${delta} points since your first version. Most resumes clear the ATS filter around 75.`
          : delta === 0
          ? "Flat so far. Tailoring to a specific job description usually moves this the most."
          : "Down from your first version — worth comparing what changed between the two."}
      </p>
    </div>
  );
}
