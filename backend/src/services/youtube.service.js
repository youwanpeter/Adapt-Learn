// backend/src/services/youtube.service.js
import axios from "axios";

const YT_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const PART = "snippet";

const REGION = process.env.YOUTUBE_REGION || "US";
const MAX = Number(process.env.YOUTUBE_MAX_RESULTS || 8);

/** Search YouTube and return normalized items */
export async function searchYoutube(query) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];

  // Temporarily removing the publishedAfter filter to ensure results return.
  // The AI prompt is still configured to search for educational content, which should maintain relevance.
  // const oneYearAgo = new Date();
  // oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  // const publishedAfter = oneYearAgo.toISOString();

  const { data } = await axios.get(YT_ENDPOINT, {
    params: {
      key,
      part: PART,
      q: query,
      type: "video",
      maxResults: MAX,
      regionCode: REGION,
      safeSearch: "moderate",
      relevanceLanguage: "en",
      // publishedAfter: publishedAfter, // Re-enabled the filter by commenting this out
      // order: "relevance", // default
    },
    timeout: 12000,
  });

  return (data.items || [])
    .map((it) => ({
      videoId: it.id?.videoId,
      title: it.snippet?.title,
      channelTitle: it.snippet?.channelTitle,
      publishedAt: it.snippet?.publishedAt,
      thumbnail:
        it.snippet?.thumbnails?.medium?.url ||
        it.snippet?.thumbnails?.default?.url,
      url: it.id?.videoId
        ? `https://www.youtube.com/watch?v=${it.id.videoId}`
        : null,
    }))
    .filter((v) => v.videoId && v.url);
}
