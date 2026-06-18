"use client";

import { cn } from "@/lib/utils";

export type MascotMood = "idle" | "happy" | "cheer" | "think" | "oops" | "wave";

const SIZES = { sm: 44, md: 64, lg: 96, xl: 128 } as const;

/**
 * "Bit" — our cheerful little robot explorer. Bit introduces topics, cheers
 * correct answers, and gives gentle nudges. Bit never says "WRONG".
 */
export function Bit({
  mood = "idle",
  size = "md",
  className,
}: {
  mood?: MascotMood;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  // Eyes + mouth change with mood. Antenna bobs in non-reduced-motion.
  const eye = mood === "think" ? "M -3 0 a3 3 0 0 1 6 0" : null; // half-closed for thinking
  const mouth =
    mood === "happy" || mood === "cheer" || mood === "wave"
      ? "M 26 44 q 12 12 24 0" // big smile
      : mood === "oops"
        ? "M 28 48 q 10 -8 20 0" // small worried curve
        : "M 30 46 q 8 6 16 0"; // gentle smile

  return (
    <span
      className={cn("inline-block select-none", mood === "cheer" && "motion-safe:animate-bounce", className)}
      aria-hidden="true"
    >
      <svg width={px} height={px} viewBox="0 0 76 86" fill="none" role="img">
        {/* antenna */}
        <line x1="38" y1="6" x2="38" y2="16" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
        <circle cx="38" cy="6" r="4" fill="#f59e0b" className="motion-safe:animate-pulse" />
        {/* head */}
        <rect x="10" y="14" width="56" height="48" rx="16" fill="url(#bitBody)" />
        <rect x="10" y="14" width="56" height="48" rx="16" fill="url(#bitShine)" />
        {/* screen face */}
        <rect x="18" y="22" width="40" height="32" rx="11" fill="#1e1b4b" />
        {/* eyes */}
        {eye ? (
          <>
            <path d={`M 28 36 ${eye}`} stroke="#a5f3fc" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d={`M 48 36 ${eye}`} stroke="#a5f3fc" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="29" cy="35" r="4.5" fill="#67e8f9" />
            <circle cx="47" cy="35" r="4.5" fill="#67e8f9" />
            <circle cx="30.5" cy="33.5" r="1.6" fill="#fff" />
            <circle cx="48.5" cy="33.5" r="1.6" fill="#fff" />
          </>
        )}
        {/* mouth */}
        <path d={mouth} stroke="#67e8f9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* arms */}
        <circle cx="8" cy="46" r="5" fill="#6366f1" className={mood === "wave" ? "motion-safe:animate-bounce" : ""} />
        <circle cx="68" cy="46" r="5" fill="#6366f1" />
        {/* body / feet */}
        <rect x="26" y="60" width="24" height="14" rx="6" fill="#4f46e5" />
        <circle cx="30" cy="78" r="5" fill="#312e81" />
        <circle cx="46" cy="78" r="5" fill="#312e81" />
        <defs>
          <linearGradient id="bitBody" x1="10" y1="14" x2="66" y2="62" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818cf8" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="bitShine" x1="10" y1="14" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

/**
 * Bit with a speech bubble. Use everywhere the mascot "talks".
 */
export function BitSays({
  children,
  mood = "happy",
  size = "md",
  className,
}: {
  children: React.ReactNode;
  mood?: MascotMood;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-3", className)}>
      <Bit mood={mood} size={size} className="shrink-0" />
      <div className="relative max-w-prose rounded-2xl rounded-bl-sm border border-brand-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
        <span
          className="absolute -left-1.5 bottom-3 h-3 w-3 rotate-45 border-b border-l border-brand-100 bg-white"
          aria-hidden="true"
        />
        {children}
      </div>
    </div>
  );
}
