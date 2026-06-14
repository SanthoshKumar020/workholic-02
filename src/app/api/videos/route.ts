import { NextResponse } from "next/server";
import { searchVideos } from "@/lib/youtube";
import { buildYoutubeSearchUrl } from "@/lib/roadmapLinks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
