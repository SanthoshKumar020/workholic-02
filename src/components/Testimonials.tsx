// ── PLACEHOLDER TESTIMONIALS ─────────────────────────────────────────────────
// Replace each entry below with a real quote once you collect feedback.
// Fields: quote, name, role, company, avatar (initials fallback used until you
// have a real photo — set avatarUrl to a URL string to use an image).

const TESTIMONIALS = [
  {
    quote:
      "HYRISE rewrote my resume in under a minute and my ATS score jumped from 42 to 78. Got two interview calls within a week of sending the updated CV.",
    name: "Placeholder Name",
    role: "Software Engineer",
    company: "Placeholder Company",
    avatarInitials: "PN",
    avatarColor: "bg-brand-600",
    // avatarUrl: "/testimonials/person1.jpg",  // uncomment when you have a real photo
  },
  {
    quote:
      "The mock interview coach is genuinely scary-good. It asked me questions I wasn't ready for and the feedback pinpointed exactly where I rambled. My next real interview felt easy by comparison.",
    name: "Placeholder Name",
    role: "Product Manager",
    company: "Placeholder Company",
    avatarInitials: "PN",
    avatarColor: "bg-violet-600",
    // avatarUrl: "/testimonials/person2.jpg",
  },
  {
    quote:
      "I used the Learning Roadmap for Data Engineering and went from zero to landing a junior DE role in 3 months. Every step had free YouTube videos and certificate courses — completely self-paced.",
    name: "Placeholder Name",
    role: "Data Engineer",
    company: "Placeholder Company",
    avatarInitials: "PN",
    avatarColor: "bg-emerald-600",
    // avatarUrl: "/testimonials/person3.jpg",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center mb-12">
        <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          What job seekers say
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Real people, real results
        </h2>
        <p className="mt-3 text-slate-500">
          Join thousands of job seekers who used HYRISE to land their next role.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            {/* Stars */}
            <div className="flex gap-0.5 text-amber-400 text-sm">
              {Array.from({ length: 5 }).map((_, j) => (
                <span key={j}>★</span>
              ))}
            </div>

            {/* Quote */}
            <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
              &ldquo;{t.quote}&rdquo;
            </p>

            {/* Author */}
            <div className="mt-6 flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${t.avatarColor}`}
              >
                {t.avatarInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-400">
                  {t.role} · {t.company}
                </p>
              </div>
            </div>

            {/* Placeholder badge — remove once real testimonials are in */}
            <span className="mt-4 inline-flex self-start items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              ✏️ Placeholder — replace with real quote
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
