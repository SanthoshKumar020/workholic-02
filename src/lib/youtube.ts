export interface VideoResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: number;
  url: string;
}

export async function searchVideos(query: string, lang = "en"): Promise<VideoResult[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];

  try {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("key", key);
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("relevanceLanguage", lang);
    searchUrl.searchParams.set("maxResults", "8");
    searchUrl.searchParams.set("part", "id,snippet");
    searchUrl.searchParams.set("safeSearch", "strict");

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const items: Array<{ id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails: Record<string, { url: string }> } }> =
      searchData.items ?? [];
    if (!items.length) return [];

    const ids = items.map((i) => i.id.videoId).join(",");

    const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    statsUrl.searchParams.set("key", key);
    statsUrl.searchParams.set("id", ids);
    statsUrl.searchParams.set("part", "statistics,snippet");

    const statsRes = await fetch(statsUrl.toString());
    if (!statsRes.ok) {
      // Fallback: return basic info without stats
      return items.map((i) => ({
        videoId: i.id.videoId,
        title: i.snippet.title,
        channel: i.snippet.channelTitle,
        thumbnail: i.snippet.thumbnails?.medium?.url ?? "",
        views: 0,
        url: `https://youtube.com/watch?v=${i.id.videoId}`,
      }));
    }

    const statsData = await statsRes.json();
    const results: VideoResult[] = (statsData.items ?? []).map(
      (v: { id: string; snippet: { title: string; channelTitle: string; thumbnails: Record<string, { url: string }> }; statistics: { viewCount?: string } }) => ({
        videoId: v.id,
        title: v.snippet.title,
        channel: v.snippet.channelTitle,
        thumbnail: v.snippet.thumbnails?.medium?.url ?? "",
        views: parseInt(v.statistics.viewCount ?? "0", 10),
        url: `https://youtube.com/watch?v=${v.id}`,
      })
    );

    return results.sort((a, b) => b.views - a.views);
  } catch {
    return [];
  }
}
