"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { TEMPLATES } from "@/pdf/templateMeta";
import { ResumeDownloadButton } from "@/components/ResumeDownloadButton";
import type { ResumePdfData } from "@/pdf/ResumePdfDocument";

function TemplatePreview({ id, accent, layout }: { id: string; accent: string; layout: string }) {
  const isSidebar = layout === "sidebar";
  const isBanner = layout === "banner";
  const isMinimal = id === "minimal";
  const isCorporate = id === "corporate";
  const isClassic = id === "classic";

  if (isClassic) {
    return (
      <div className="h-36 overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
        <div className="border-t border-slate-800" />
        <div className="text-center py-0.5">
          <div className="inline-block h-1 w-24 rounded bg-slate-300" />
        </div>
        <div className="border-t border-slate-800 mb-1" />
        <div className="mx-auto h-3 w-28 rounded bg-slate-900 mb-0.5" />
        <div className="mx-auto h-1.5 w-16 rounded bg-slate-400 mb-1" />
        <div className="border-t border-slate-800 mb-0.5" />
        <div className="border-t border-slate-800 mb-1.5" />
        {[1, 2].map((s) => (
          <div key={s} className="mb-2">
            <div className="border-t border-slate-500 mb-0.5" />
            <div className="mx-auto h-1.5 w-14 rounded bg-slate-800 mb-0.5" />
            <div className="border-t border-slate-500 mb-1" />
            <div className="flex justify-between mb-0.5">
              <div className="h-1 w-16 rounded bg-slate-800" />
              <div className="h-1 w-8 rounded bg-slate-600" />
            </div>
            <div className="flex justify-between mb-0.5">
              <div className="h-1 w-20 rounded bg-slate-300" />
              <div className="h-1 w-10 rounded bg-slate-300" />
            </div>
            <div className="h-1 w-full rounded bg-slate-100 mt-0.5" />
            <div className="h-1 w-11/12 rounded bg-slate-100 mt-0.5" />
          </div>
        ))}
      </div>
    );
  }

  if (isSidebar) {
    return (
      <div className="h-36 overflow-hidden rounded-lg border border-slate-200 flex">
        <div className="w-[34%] flex flex-col gap-1 p-2" style={{ backgroundColor: accent }}>
          <div className="h-7 w-7 rounded-full bg-white/30 self-center mb-1" />
          <div className="h-1.5 w-10/12 rounded bg-white/70 self-center" />
          <div className="h-1 w-8/12 rounded bg-white/40 self-center" />
          <div className="mt-1.5 h-1 w-full rounded bg-white/25" />
          <div className="h-1 w-10/12 rounded bg-white/25" />
          <div className="h-1 w-9/12 rounded bg-white/25" />
          <div className="mt-1.5 h-1 w-full rounded bg-white/25" />
          <div className="h-1 w-8/12 rounded bg-white/25" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {[1, 2].map((s) => (
            <div key={s}>
              <div className="h-1.5 w-16 rounded mb-1" style={{ backgroundColor: accent }} />
              <div className="h-px w-full mb-1.5" style={{ backgroundColor: accent }} />
              <div className="h-1 w-full rounded bg-slate-200 mb-0.5" />
              <div className="h-1 w-10/12 rounded bg-slate-100" />
              <div className="h-1 w-11/12 rounded bg-slate-100 mt-0.5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isBanner) {
    return (
      <div className="h-36 overflow-hidden rounded-lg border border-slate-200">
        <div className="h-11 px-2.5 py-2 flex flex-col justify-center" style={{ backgroundColor: accent }}>
          <div className="h-2 w-24 rounded bg-white/90" />
          <div className="h-1 w-16 rounded bg-white/60 mt-1" />
          <div className="h-1 w-32 rounded bg-white/40 mt-1" />
        </div>
        <div className="px-2.5 py-2 space-y-1.5 bg-white">
          {[1, 2, 3].map((s) => (
            <div key={s}>
              <div className="h-1.5 w-14 rounded mb-0.5" style={{ backgroundColor: accent }} />
              <div className="h-px w-full mb-1" style={{ backgroundColor: accent + "40" }} />
              <div className="h-1 w-full rounded bg-slate-100" />
              <div className="h-1 w-10/12 rounded bg-slate-100 mt-0.5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isMinimal) {
    return (
      <div className="h-36 overflow-hidden rounded-lg border border-slate-200 bg-[#fafafa] p-2.5">
        <div className="h-2.5 w-28 rounded bg-slate-800 mb-0.5" />
        <div className="h-1.5 w-20 rounded bg-slate-400 mb-1" />
        <div className="h-px w-full bg-slate-200 mb-2" />
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex gap-3 mb-2">
            <div className="w-16 shrink-0">
              <div className="h-1 w-12 rounded bg-slate-400 mb-0.5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="h-1 w-full rounded bg-slate-200" />
              <div className="h-1 w-10/12 rounded bg-slate-100" />
              <div className="h-1 w-11/12 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isCorporate) {
    return (
      <div className="h-36 overflow-hidden rounded-lg border border-slate-200 bg-[#fffbfb] p-2.5 text-center">
        <div className="mx-auto h-2.5 w-28 rounded bg-slate-800 mb-0.5" />
        <div className="mx-auto h-1.5 w-20 rounded mb-1" style={{ backgroundColor: accent + "cc" }} />
        <div className="h-px w-full mb-0.5" style={{ backgroundColor: accent }} />
        <div className="h-0.5 w-full bg-slate-100 mb-2" />
        {[1, 2, 3].map((s) => (
          <div key={s} className="mb-1.5">
            <div className="mx-auto h-1.5 w-16 rounded mb-0.5" style={{ backgroundColor: accent + "80" }} />
            <div className="h-px w-full mb-1" style={{ backgroundColor: accent + "40" }} />
            <div className="h-1 w-full rounded bg-slate-200 mb-0.5" />
            <div className="h-1 w-10/12 mx-auto rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  // Executive (default single-column)
  return (
    <div className="h-36 overflow-hidden rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="h-2.5 w-24 rounded mb-0.5" style={{ backgroundColor: accent }} />
      <div className="h-1.5 w-16 rounded bg-slate-300 mb-0.5" />
      <div className="h-1 w-28 rounded bg-slate-200 mb-1" />
      <div className="h-px w-full mb-1.5" style={{ backgroundColor: accent }} />
      {[1, 2, 3].map((s) => (
        <div key={s} className="mb-1.5">
          <div className="h-1.5 w-14 rounded mb-0.5" style={{ backgroundColor: accent + "cc" }} />
          <div className="h-px w-full mb-1" style={{ backgroundColor: accent + "40" }} />
          <div className="h-1 w-full rounded bg-slate-100" />
          <div className="h-1 w-10/12 rounded bg-slate-100 mt-0.5" />
        </div>
      ))}
    </div>
  );
}

export function TemplatePicker({
  isPro,
  baseData,
  onTemplateChange,
}: {
  isPro: boolean;
  baseData: Omit<ResumePdfData, "templateId" | "withPhoto" | "photoDataUrl">;
  onTemplateChange?: (templateId: string) => void;
}) {
  const [withPhoto, setWithPhoto] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      {/* Photo option */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={withPhoto}
            onChange={(e) => setWithPhoto(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 accent-brand-600"
          />
          Include profile photo
        </label>
        {withPhoto && (
          <input
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 dark:text-slate-400"
          />
        )}
        {withPhoto && photoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoDataUrl} alt="preview" className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-300" />
        )}
      </div>

      {/* Template grid — each card is its own preview + download */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => {
          const locked = t.pro && !isPro;
          const pdfData: ResumePdfData = {
            ...baseData,
            templateId: t.id,
            withPhoto,
            photoDataUrl: withPhoto ? photoDataUrl : undefined,
          };

          return (
            <div
              key={t.id}
              className={`relative flex flex-col overflow-hidden rounded-2xl border-2 transition ${
                locked
                  ? "border-slate-200 dark:border-slate-700"
                  : "border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-600"
              }`}
            >
              {/* Pro lock overlay */}
              {locked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/80 backdrop-blur-[2px] dark:bg-slate-900/80">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">Pro template</span>
                  <Link
                    href="/billing"
                    className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600"
                  >
                    Upgrade to unlock
                  </Link>
                </div>
              )}

              {/* Template preview thumbnail */}
              <div className="p-3 pb-0">
                <TemplatePreview id={t.id} accent={t.accent} layout={t.layout} />
              </div>

              {/* Card footer */}
              <div className="flex flex-1 flex-col gap-2 p-3 pt-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{t.description}</p>
                </div>

                {!locked && (
                  <div className="mt-auto pt-1">
                    <ResumeDownloadButton
                      data={pdfData}
                      fileName={`${baseData.name || "resume"}-${t.name.toLowerCase().replace(/\s+/g, "-")}.pdf`}
                      label="Download PDF"
                      fullWidth
                      onClick={() => onTemplateChange?.(t.id)}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isPro && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Free plan includes Classic, Executive &amp; Minimal.{" "}
          <Link href="/billing" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Upgrade to Pro
          </Link>{" "}
          to unlock all 4 premium templates.
        </p>
      )}
    </div>
  );
}
