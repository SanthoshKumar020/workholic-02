type Tone = "error" | "success" | "info" | "warning";

const tones: Record<Tone, string> = {
  error: "bg-red-50 text-red-800 border-red-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  info: "bg-brand-50 text-brand-800 border-brand-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
};

export function Alert({
  tone = "info",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`} role="alert">
      {children}
    </div>
  );
}
