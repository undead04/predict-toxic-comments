import { google } from "googleapis";
import {
  MessageType,
  ILiveChatMessageResourceResponse,
  KafkaPayload,
} from "../types/YoutubeComment";
import { sendToKafka } from "./kafka-producer";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

export async function getLiveChatId(videoId: string): Promise<string | null> {
  console.log(process.env.YOUTUBE_API_KEY);
  const res = await youtube.videos.list({
    auth: process.env.YOUTUBE_API_KEY,
    part: ["liveStreamingDetails"],
    id: [videoId],
  });
  return res.data.items?.[0]?.liveStreamingDetails?.activeLiveChatId || null;
}

export async function fetchChatMessages(
  chatId: string,
  nextPageToken?: string
) {
  try {
    const res: any = await youtube.liveChatMessages.list({
      auth: process.env.YOUTUBE_API_KEY,
      liveChatId: chatId,
      part: ["snippet", "authorDetails"],
      pageToken: nextPageToken,
    });

    const messages = res.data.items as ILiveChatMessageResourceResponse[];

    messages?.forEach((msg) => {
      let comment: KafkaPayload;

      if (msg.snippet.type === "textMessageEvent") {
        comment = {
          type: MessageType.CHAT,
          id: msg.id,
          videoId: msg.snippet.liveChatId,
          data: {
            message: msg.snippet.textMessageDetails.messageText,
            authorId: msg.snippet.authorChannelId,
            authorImage: msg.authorDetails.profileImageUrl,
            authorName: msg.authorDetails.displayName,
            timestamp: msg.snippet.publishedAt.toString(),
            isModerator: msg.authorDetails.isChatModerator || false,
          },
        };
      } else if (msg.snippet.type === "messageDeletedEvent") {
        comment = {
          type: MessageType.DELETED,
          id: msg.snippet.messageDeletedDetails.deletedMessageId,
          videoId: msg.snippet.liveChatId,
          data: {
            timestamp: msg.snippet.publishedAt.toString(),
          },
        };
      } else {
        return;
      }
      sendToKafka(process.env.KAFKA_TOPIC || "comment", comment);
    });

    // Đệ quy để lấy batch tiếp theo sau 5 giây
    setTimeout(() => {
      fetchChatMessages(chatId, res.data.nextPageToken);
    }, 5000);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
  }
}
