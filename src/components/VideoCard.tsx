import type { VideoResult } from "@/lib/types";
import { Play, Eye } from "lucide-react";

export function VideoCard({ video }: { video: VideoResult }) {
  function formatViews(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  }

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-50">
            <Play className="h-10 w-10 text-brand-300" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md transition group-hover:opacity-100">
            <Play className="h-4 w-4 text-slate-900 fill-slate-900" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-brand-600">
          {video.title}
        </p>
        <p className="mt-1 text-xs text-slate-500">{video.channel}</p>
        {video.views > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <Eye className="h-3 w-3" />
            {formatViews(video.views)} views
          </div>
        )}
      </div>
    </a>
  );
}
