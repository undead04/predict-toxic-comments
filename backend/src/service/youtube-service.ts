import { google } from "googleapis";
import {
  MessageType,
  ILiveChatMessageResourceResponse,
  KafkaPayload,
} from "../types/YoutubeComment";
import { sendToKafka } from "./kafka-producer";
import { KAFKA_TOPIC, YOUTUBE_API_KEY } from "../utils/config";
import { sleep } from "../utils/sleep";
import { saveStateActiveCrawlers, setStatusActiveCrawlers, getStatusActiveCrawlers, getStateActiveCrawlers, delLockActiveCrawlers, redis, REDIS_KEYS, redisStream } from "./redis-service";
import { StatusCrawler } from "./redis-service";
import { AppError } from "../error/AppError";
const youtube = google.youtube({
  version: "v3",
  auth: YOUTUBE_API_KEY,
});

export async function getLiveChatId(videoId: string): Promise<string | null> {
  const res = await youtube.videos.list({
    auth: YOUTUBE_API_KEY,
    part: ["liveStreamingDetails"],
    id: [videoId],
  });
  return res.data.items?.[0]?.liveStreamingDetails?.activeLiveChatId || null;
}

export async function fetchChatMessages(
  chatId: string,
  videoId: string,
  nextPageToken?: string,
): Promise<{
  messages: KafkaPayload[];
  nextPageToken?: string;
  pollingIntervalMillis: number;
}> {
  const res: any = await youtube.liveChatMessages.list({
    auth: YOUTUBE_API_KEY,
    liveChatId: chatId,
    part: ["snippet", "authorDetails"],
    pageToken: nextPageToken,
  });

  const items: ILiveChatMessageResourceResponse[] = res.data
    .items as ILiveChatMessageResourceResponse[];
  const messages: KafkaPayload[] = [];

  for (const msg of items) {
    if (msg.snippet.type === "textMessageEvent") {
      messages.push({
        type: MessageType.CHAT,
        commentId: msg.id,
        videoId: videoId,
        message: msg.snippet.textMessageDetails.messageText,
        authorId: msg.snippet.authorChannelId,
        authorImage: msg.authorDetails.profileImageUrl,
        authorName: msg.authorDetails.displayName,
        publishedAt: msg.snippet.publishedAt,
      });
    }
  }

  return {
    messages,
    nextPageToken: res.data.nextPageToken,
    pollingIntervalMillis: res.data.pollingIntervalMillis || 2000,
  };
}

export async function crawlLiveChat(liveChatId: string, videoId: string) {
  let nextPageToken: string | undefined = await getStateActiveCrawlers(liveChatId) || undefined;
  console.log(`▶ Start crawling liveChatId=${liveChatId} videoId=${videoId}`);
  await setStatusActiveCrawlers(liveChatId, StatusCrawler.RUNNING);
  await redisStream.xadd(REDIS_KEYS.STREAM_CRAWLER, "MAXLEN", "~", 1000, "*", "data", JSON.stringify({
    type: StatusCrawler.RUNNING,
    liveChatId,
    videoId,
  }));
  while (await getStatusActiveCrawlers(liveChatId) === StatusCrawler.RUNNING) {
    try {
      const {
        messages,
        nextPageToken: newToken,
        pollingIntervalMillis,
      } = await fetchChatMessages(liveChatId, videoId, nextPageToken);

      if (messages.length > 0) {
        await sendToKafka(KAFKA_TOPIC, messages);
      }

      nextPageToken = newToken;
      if (nextPageToken) {
        await saveStateActiveCrawlers(liveChatId, nextPageToken);
      }
      await sleep(pollingIntervalMillis);
    } catch (err: any) {
      // live kết thúc
      if (err?.errors?.[0]?.reason === "liveChatEnded") {
        console.log("🛑 Live chat ended, stop crawler");
        await setStatusActiveCrawlers(liveChatId, StatusCrawler.ENDED);
        await redis.xadd(REDIS_KEYS.STREAM_CRAWLER, "MAXLEN", "~", 1000, "*", "data", JSON.stringify({
          type: StatusCrawler.ENDED,
          liveChatId,
          videoId,
        }));
      }
      console.error("❌ Crawl Error:", err);
      await setStatusActiveCrawlers(liveChatId, StatusCrawler.ERROR);
      await redisStream.xadd(REDIS_KEYS.STREAM_CRAWLER, "MAXLEN", "~", 1000, "*", "data", JSON.stringify({
        type: StatusCrawler.ERROR,
        liveChatId,
        videoId,
      }));
      await delLockActiveCrawlers(liveChatId)
      await sleep(5000); // backoff
    }
  }
}

/**
 * Service to handle stopping or ending the live chat crawler.
 * @param liveChatId ID of the live chat to control.
 * @param videoId ID of the video for SSE broadcasting.
 * @param action "stop" to pause, "end" to completely terminate and clear state.
 */
export async function stopCrawlerService(liveChatId: string, videoId: string, action: "stop"): Promise<string> {
  const currentStatus = await getStatusActiveCrawlers(liveChatId);

  if (!currentStatus) {
    throw new AppError("No active crawler found for this live chat", 400);
  }

  await setStatusActiveCrawlers(liveChatId, StatusCrawler.STOPPED);
  await delLockActiveCrawlers(liveChatId)
  await redisStream.xadd(REDIS_KEYS.STREAM_CRAWLER, "MAXLEN", "~", 1000, "*", "data", JSON.stringify({
    type: StatusCrawler.STOPPED,
    liveChatId,
    videoId,
  }));
  return `Crawler for liveChat ${liveChatId} has been stopped.`;
}
