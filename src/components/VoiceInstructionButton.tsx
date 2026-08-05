"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Check, RotateCcw, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Voice-driven instruction capture for the Resume AI Studio chat editor.
 *
 * Flow the user asked for explicitly: speech-to-text → show what was heard →
 * confirm (by voice OR by tapping "Yes, apply it") → auto-fire onConfirmed()
 * with zero typing required. Saying "no" / "try again" (or tapping the redo
 * button) discards the transcript and goes back to listening.
 *
 * Uses the ambient SpeechRecognition types already declared in
 * src/types/speech.d.ts — intentionally not redeclared here.
 *
 * Recognition language is switchable between en-IN and ta-IN so both English
 * and Tamil speech transcribe accurately at the browser level. Thanglish
 * (mixed Tamil+English in one utterance) isn't something the browser
 * recognizer can be told to expect — it's handled downstream by the AI system
 * prompt that receives the transcript, per the scope note in translations.ts.
 */

type Phase = "idle" | "listening" | "reviewing" | "unsupported";
type RecogLang = "en-IN" | "ta-IN";

// Confirmation-utterance parsing: English, Tamil script, and common Thanglish
// spellings of yes/no, since a user confirming by voice may say any of these.
const YES_PATTERN =
  /\b(yes|yeah|yep|yup|ok|okay|correct|confirm|apply|do it|go ahead|seri|sari|aam|aama|aamaa|आम|ஆம்|சரி)\b/i;
const NO_PATTERN =
  /\b(no|nope|cancel|stop|wait|redo|try again|illa|venda|vendam|இல்லை|வேண்டாம்)\b/i;

export function VoiceInstructionButton({
  onConfirmed,
  disabled,
}: {
  onConfirmed: (text: string) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [recogLang, setRecogLang] = useState<RecogLang>("en-IN");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTextRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setPhase("unsupported");
    }
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const evaluateConfirmation = useCallback(
    (heard: string) => {
      const trimmed = heard.trim();
      if (!trimmed) return;
      if (YES_PATTERN.test(trimmed) && !NO_PATTERN.test(trimmed)) {
        // Confirmed by voice — auto-fire immediately, no button press needed.
        const toApply = finalTextRef.current.replace(YES_PATTERN, "").trim() || finalTextRef.current;
        setPhase("idle");
        setTranscript("");
        setInterim("");
        onConfirmed(toApply);
        return;
      }
      if (NO_PATTERN.test(trimmed)) {
        // Discard and go back to listening for a fresh instruction.
        finalTextRef.current = "";
        setTranscript("");
        setInterim("");
        startListening();
        return;
      }
      // More speech that isn't a clear yes/no — treat it as additional
      // instruction content and keep listening, appended to what we have.
      finalTextRef.current = `${finalTextRef.current} ${trimmed}`.trim();
      setTranscript(finalTextRef.current);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onConfirmed]
  );

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setPhase("unsupported");
      return;
    }
    recognitionRef.current?.abort();
    const recognition = new Ctor();
    recognition.lang = recogLang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalChunk += `${text} `;
        } else {
          interimText += text;
        }
      }
      setInterim(interimText);
      if (finalChunk.trim()) {
        finalTextRef.current = `${finalTextRef.current} ${finalChunk}`.trim();
        setTranscript(finalTextRef.current);
        setPhase("reviewing");
        setInterim("");
      }
    };
    recognition.onerror = () => {
      setPhase(finalTextRef.current ? "reviewing" : "idle");
    };
    recognition.onend = () => {
      // If we ended up with text but never flipped to reviewing (e.g. the
      // browser only ever emits a final result on stop), do it now.
      setPhase((p) => (p === "listening" ? (finalTextRef.current ? "reviewing" : "idle") : p));
    };

    recognitionRef.current = recognition;
    finalTextRef.current = "";
    setTranscript("");
    setInterim("");
    setPhase("listening");
    recognition.start();
  }, [recogLang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setPhase(finalTextRef.current ? "reviewing" : "idle");
  }, []);

  // While reviewing, keep listening for a spoken "yes"/"no"/more content —
  // this is a second, short-lived recognizer pass dedicated to confirmation.
  useEffect(() => {
    if (phase !== "reviewing") return;
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;

    const confirmRecognition = new Ctor();
    confirmRecognition.lang = recogLang;
    confirmRecognition.continuous = false;
    confirmRecognition.interimResults = false;
    confirmRecognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const heard = last?.[0]?.transcript ?? "";
      evaluateConfirmation(heard);
    };
    confirmRecognition.start();
    recognitionRef.current = confirmRecognition;

    return () => {
      confirmRecognition.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, recogLang]);

  const applyNow = () => {
    if (!finalTextRef.current.trim()) return;
    const toApply = finalTextRef.current;
    setPhase("idle");
    setTranscript("");
    setInterim("");
    onConfirmed(toApply);
  };

  const redo = () => {
    finalTextRef.current = "";
    setTranscript("");
    setInterim("");
    startListening();
  };

  if (phase === "unsupported") {
    return <p className="text-xs text-slate-400">{t("voice_unsupported")}</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {phase === "idle" && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={startListening}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mic className="h-4 w-4" />
            {t("voice_start")}
          </button>
          <div className="flex overflow-hidden rounded-full border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setRecogLang("en-IN")}
              className={`px-2.5 py-1.5 font-medium transition ${
                recogLang === "en-IN" ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t("voice_lang_english")}
            </button>
            <button
              type="button"
              onClick={() => setRecogLang("ta-IN")}
              className={`px-2.5 py-1.5 font-medium transition ${
                recogLang === "ta-IN" ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t("voice_lang_tamil")}
            </button>
          </div>
        </div>
      )}

      {phase === "listening" && (
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
              </span>
              {t("voice_listening")}
            </span>
            <button
              type="button"
              onClick={stopListening}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <Square className="h-3 w-3" />
              {t("voice_stop")}
            </button>
          </div>
          {(transcript || interim) && (
            <p className="text-sm text-slate-600">
              {transcript} <span className="text-slate-400">{interim}</span>
            </p>
          )}
        </div>
      )}

      {phase === "reviewing" && (
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t("voice_heard")}</p>
          <p className="text-sm font-medium text-slate-800">{transcript}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("voice_confirm_prompt")}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={applyNow}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <Check className="h-4 w-4" />
              {t("voice_confirm_yes")}
            </button>
            <button
              type="button"
              onClick={redo}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              {t("voice_confirm_redo")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
