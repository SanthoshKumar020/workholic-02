"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Strip <b>/<i> tags and collapse whitespace so the voice reads clean text. */
function clean(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Read-aloud powered by the free browser SpeechSynthesis API.
 * Provides a speak/stop API plus an "auto-read" toggle (on by default in Kid mode).
 */
export function useReadAloud(opts?: { defaultEnabled?: boolean; rate?: number }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(opts?.defaultEnabled ?? false);
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer a clear, friendly English voice when one is available.
      voiceRef.current =
        voices.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|zira|google/i.test(v.name)) ||
        voices.find((v) => /^en/i.test(v.lang)) ||
        voices[0] ||
        null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, force = false) => {
      if (!supported) return;
      if (!enabled && !force) return;
      const t = clean(text);
      if (!t) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = opts?.rate ?? 0.95;
      u.pitch = 1.05;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [supported, enabled, opts?.rate],
  );

  const toggle = useCallback(() => {
    setEnabled((e) => {
      if (e) window.speechSynthesis?.cancel();
      return !e;
    });
  }, []);

  return { supported, enabled, setEnabled, toggle, speak, stop, speaking };
}

export type ReadAloud = ReturnType<typeof useReadAloud>;
