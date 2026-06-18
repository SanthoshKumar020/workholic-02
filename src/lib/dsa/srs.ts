// SM-2 spaced-repetition algorithm.
// Reference: https://super-memory.com/english/ol/sm2.htm

export interface SrsState {
  ease: number; // easiness factor, >= 1.3
  interval: number; // days until next review
  repetitions: number; // number of consecutive correct recalls
}

export const SRS_DEFAULT: SrsState = { ease: 2.5, interval: 0, repetitions: 0 };

/**
 * Update an SRS item from a self-rated recall quality.
 * quality: 0–5 (0 = total blackout, 3 = correct with difficulty, 5 = perfect).
 * Returns the new state plus how many days from now it's next due.
 */
export function sm2(prev: SrsState, quality: number): SrsState & { dueInDays: number } {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let { ease, interval, repetitions } = prev;

  if (q < 3) {
    // Failed recall — reset the streak, review again soon.
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * ease);
  }

  // Adjust the easiness factor.
  ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease < 1.3) ease = 1.3;

  return { ease: Number(ease.toFixed(2)), interval, repetitions, dueInDays: interval };
}

/** Maps a kid-friendly confidence pick to an SM-2 quality score. */
export const CONFIDENCE_TO_QUALITY: Record<string, number> = {
  again: 1, // "I forgot"
  hard: 3, // "Tricky, but I got it"
  good: 4, // "I knew it"
  easy: 5, // "Too easy!"
};

/** Returns an ISO date (YYYY-MM-DD) `days` from `from`. */
export function dueDateFrom(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
