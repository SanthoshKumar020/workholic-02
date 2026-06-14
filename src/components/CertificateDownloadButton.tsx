"use client";

import { useState } from "react";

export function CertificateDownloadButton({
  userName,
  topic,
}: {
  userName: string;
  topic: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    setLoading(true);
    try {
      const [rendererMod, docMod] = await Promise.all([
        import(/* webpackChunkName: "react-pdf-renderer" */ "@react-pdf/renderer"),
        import(/* webpackChunkName: "certificate-pdf-doc" */ "@/pdf/CertificatePdfDocument"),
      ]);
      const { pdf } = rendererMod;
      const { CertificatePdfDocument } = docMod;
      const completedDate = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
      const blob = await pdf(
        <CertificatePdfDocument userName={userName} topic={topic} completedDate={completedDate} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${topic}-certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Could not generate certificate.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Generating…" : "Download Certificate"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
