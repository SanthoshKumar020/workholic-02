"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ResumePdfData } from "@/pdf/ResumePdfDocument";

export function ResumeDownloadButton({
  data,
  fileName = "resume.pdf",
  label = "Download PDF",
  variant = "primary",
  fullWidth = false,
  onClick,
}: {
  data: ResumePdfData;
  fileName?: string;
  label?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  onClick?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    onClick?.();
    setError(null);
    setLoading(true);
    try {
      // Dynamically import so the renderer bundle is only loaded on click,
      // never during SSR. The /* webpackChunkName */ hint gives it a stable name.
      const [rendererMod, docMod] = await Promise.all([
        import(/* webpackChunkName: "react-pdf-renderer" */ "@react-pdf/renderer"),
        import(/* webpackChunkName: "resume-pdf-doc" */ "@/pdf/ResumePdfDocument"),
      ]);
      const { pdf } = rendererMod;
      const { ResumePdfDocument } = docMod;
      const blob = await pdf(<ResumePdfDocument {...data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Could not generate the PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant={variant} onClick={handleDownload} loading={loading} className={fullWidth ? "w-full justify-center" : undefined}>
        {label}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
