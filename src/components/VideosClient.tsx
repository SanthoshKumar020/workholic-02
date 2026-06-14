"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { VideoCard } from "@/components/VideoCard";
import { Search, ExternalLink } from "lucide-react";
import type { VideoResult } from "@/lib/types";

const POPULAR_TOPICS = [
  "Resume writing tips",
  "Job interview techniques",
  "Python for beginners",
  "Data science roadmap",
  "JavaScript full stack",
  "Excel for data analysis",
  "LinkedIn profile optimization",
  "Salary negotiation tips",
];

export function VideosClient({ preferredLanguage }: { preferredLanguage: string }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function search(q = query) {
    if (!q.trim()) return;
    setLoading(true);
    setVideos([]);
    setFallbackUrl(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/videos?q=${encodeURIComponent(q)}&lang=${preferredLanguage}`);
      const data = await res.json();
      setVideos(data.videos || []);
      setFallbackUrl(data.fallbackUrl || null);
    } catch {
      setFallbackUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => { e.preventDefault(); search(); }}
        className="flex gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for any topic..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <Button type="submit" loading={loading} disabled={!query.trim()}>
          Search
        </Button>
      </form>

      {/* Popular topics */}
      {!searched && (
        <div>
          <p className="mb-3 text-sm font-medium text-slate-500">Popular topics</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => { setQuery(t); search(t); }}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="aspect-video rounded-t-2xl bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-full rounded bg-slate-200" />
                <div className="h-3 w-2/3 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && videos.length === 0 && fallbackUrl && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600 mb-4">Could not load videos directly. Search on YouTube instead:</p>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white"
          >
            Open YouTube search <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div>
          <p className="mb-4 text-sm text-slate-500">{videos.length} videos found</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => <VideoCard key={v.videoId} video={v} />)}
          </div>
        </div>
      )}
    </div>
  );
}
