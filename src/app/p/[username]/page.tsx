import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Globe, Link2, ExternalLink, Award, CheckCircle } from "lucide-react";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { shareText, SITE_URL } from "@/lib/share";

export const dynamic = "force-dynamic";

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `${params.username} — HYRISE Profile` };
}

function certId(userId: string, title: string): string {
  const slug = title.replace(/\s+/g, "").slice(0, 4).toUpperCase();
  const uid = userId.replace(/-/g, "").slice(0, 4).toUpperCase();
  const yr = new Date().getFullYear();
  return `CERT-${uid}${slug}${yr}`;
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default async function PublicProfilePage({ params }: Props) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, target_role, public_bio, is_public, linkedin_url, github_url, portfolio_url, completed_certs, created_at, plan")
    .eq("username", params.username)
    .single();

  if (!profile || !profile.is_public) notFound();

  const certs = (profile.completed_certs as { title: string; completedAt: string }[]) ?? [];
  const memberYear = new Date(profile.created_at).getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header bar */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-sm font-bold text-brand-700">HYRISE</Link>
          <Link href="/login" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
            Sign in
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        {/* Profile card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-2xl font-bold text-white shadow">
              {initials(profile.full_name ?? params.username)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900">{profile.full_name ?? params.username}</h1>
                {profile.plan === "pro" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">PRO</span>
                )}
              </div>
              {profile.target_role && (
                <p className="mt-0.5 font-semibold text-brand-600">{profile.target_role}</p>
              )}
              <p className="mt-0.5 text-sm text-slate-400">@{params.username} · member since {memberYear}</p>
              {profile.public_bio && (
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{profile.public_bio}</p>
              )}
              {/* Social links */}
              <div className="mt-4 flex flex-wrap gap-3">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-[#0077b5]/30 bg-[#0077b5]/5 px-3 py-1.5 text-xs font-semibold text-[#0077b5] hover:bg-[#0077b5]/10 transition">
                    <Link2 className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                    <Link2 className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                    <Globe className="h-3.5 w-3.5" /> Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Certificates */}
        {certs.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Award className="h-5 w-5 text-amber-500" /> Certificates & Completed Roadmaps
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {certs.map((cert, i) => {
                const id = certId(profile.id, cert.title);
                return (
                  <div key={i} className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                    {/* Top accent */}
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900">{cert.title}</p>
                          {cert.completedAt && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              Completed {new Date(cert.completedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            </p>
                          )}
                        </div>
                        <CheckCircle className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-slate-400">{id}</span>
                        <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-bold text-green-700 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </span>
                      </div>
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <WhatsAppShareButton
                          text={shareText.certificate(cert.title)}
                          url={`${SITE_URL}/p/${params.username}`}
                          size="sm"
                          label="Share on WhatsApp"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {certs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400">
            <Award className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm">No certificates added yet.</p>
          </div>
        )}

        {/* Footer CTA */}
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-center">
          <p className="text-sm font-semibold text-brand-800">Build your own career profile with HYRISE</p>
          <p className="mt-0.5 text-xs text-brand-600">Free tools: Resume builder, Job match, Aptitude prep, Roadmaps & more</p>
          <Link href="/signup" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition">
            Get started free <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}

