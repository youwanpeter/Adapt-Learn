import { searchYouTube } from "../utils/youtube.js";

export const videosForTopic = async (topic) => {
  const q = `${topic.title} explained`;
  return await searchYouTube(q, 3);
};
