"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ResumeDownloadButton } from "@/components/ResumeDownloadButton";
import { AtsScoreRing } from "@/components/AtsScoreRing";
import { Button } from "@/components/ui/Button";
import type { Resume } from "@/lib/types";

export function DashboardClient({
  resumes: initialResumes,
  isPro,
}: {
  resumes: Resume[];
  isPro: boolean;
}) {
  const [resumes, setResumes] = useState<Resume[]>(initialResumes);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/resumes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setResumes((prev) => prev.filter((r) => r.id !== id));
        setConfirmId(null);
        if (openId === id) setOpenId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (resumes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900">No resumes yet</h3>
        <p className="mt-1 text-sm text-slate-500">
          Create your first enhanced resume to see it here.
        </p>
        <Link
          href="/builder"
          className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Build a resume
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resumes.map((r) => {
        const open = openId === r.id;
        const confirming = confirmId === r.id;
        const deleting = deletingId === r.id;

        return (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <AtsScoreRing score={r.ats_score ?? 0} size={72} label="ATS" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{r.title}</h3>
                  <p className="text-sm text-slate-500">
                    {r.target_role || "No target role"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Template: <span className="capitalize">{r.template_id}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpenId(open ? null : r.id)}>
                  {open ? "Hide" : "View"}
                </Button>
                <Link
                  href="/builder"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Edit
                </Link>
                <ResumeDownloadButton
                  variant="secondary"
                  label="Download"
                  fileName={`${r.title || "resume"}.pdf`}
                  data={{
                    name: r.title,
                    targetRole: r.target_role ?? undefined,
                    enhancedText: r.enhanced_text ?? r.original_text ?? "",
                    atsScore: r.ats_score,
                    templateId: isPro ? r.template_id : "classic",
                  }}
                />

                {/* Delete button / inline confirm */}
                {!confirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirmId(r.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Delete resume"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5">
                    <span className="text-xs font-medium text-red-700">Delete?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={deleting}
                      className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {deleting ? "…" : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded-md px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {open && (
              <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
                {r.enhanced_text || r.original_text || "(empty)"}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
