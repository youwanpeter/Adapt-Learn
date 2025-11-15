import fetch from "node-fetch";

export const searchYouTube = async (q, maxResults = 3) => {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", key);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", q);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(maxResults));
  const res = await fetch(url);
  const data = await res.json();
  return (data.items || []).map((i) => ({
    videoId: i.id.videoId,
    title: i.snippet.title,
    channel: i.snippet.channelTitle,
  }));
};
