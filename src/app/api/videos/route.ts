import { NextResponse } from "next/server";
import { searchVideos } from "@/lib/youtube";
import { buildYoutubeSearchUrl } from "@/lib/roadmapLinks";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A YouTube `search.list` costs 100 units against a 10,000/day default quota,
 * and each call here makes two API requests. Roughly 50 unthrottled anonymous
 * requests would exhaust the day's quota and break video search for every
 * user, so this needs a per-device cap.
 */
const VIDEO_DAILY_LIMIT = 30;

export async function GET(request: Request) {
  const { allowed, retryAfter } = rateLimit(clientKey(request, "videos"), VIDEO_DAILY_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Video search limit reached for today." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const lang = searchParams.get("lang") || "en";

  if (!q) return NextResponse.json({ error: "Query parameter 'q' is required." }, { status: 400 });

  const videos = await searchVideos(q, lang);

  if (videos.length === 0) {
    // Graceful quota fallback: return a search link
    return NextResponse.json({
      videos: [],
      fallbackUrl: buildYoutubeSearchUrl(q),
      message: "Could not load videos. Use the search link to find them on YouTube.",
    });
  }

  return NextResponse.json({ videos });
}
