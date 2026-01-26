import { Response } from "express";
import { redis, REDIS_KEYS, REDIS_TTL } from "./redis-service";
import { getCommentsByVideoId } from "./comment-analysis-service";
import { getMetricsByVideoId } from "./stream-metric-service";
import { CommentModel } from "../model/LiveCommentAnalysis";
import { MetricModel } from "../model/LiveStreamMetric";
import { ToxicUserModel } from "../model/ToxicUserMetric";
import { UserInfo, getToxicUserAggregates } from "./toxic-user-service";
import Redis from "ioredis";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "../utils/config";

/**
 * Quản lý các kết nối SSE.
 * Key: videoId (string)
 * Value: Mảng các Express Response objects.
 */
const clients = new Map<string, Response[]>();

/**
 * Bộ nhớ đệm (Cache) để lưu trữ trạng thái trước đó của leaderboard cho mỗi video.
 */
const previousLeaderboards = new Map<string, string>();

/**
 * Redis Subscriber instance.
 */
const redisSub = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
});

/**
 * Thêm một client mới vào danh sách theo dõi.
 */
export const addSSEClient = async (videoId: string, res: Response) => {
    if (!clients.has(videoId)) {
        clients.set(videoId, []);
    }
    clients.get(videoId)?.push(res);

    // Gửi dữ liệu ban đầu cho client
    try {
        const initialComments = await getCommentsByVideoId(videoId);
        sendSSE(res, "initial_comments", initialComments);

        const initialMetrics = await getMetricsByVideoId(videoId);
        sendSSE(res, "initial_metrics", initialMetrics);

        await sendCurrentLeaderboard(videoId, res);
    } catch (error) {
        console.error(`Lỗi khi gửi dữ liệu ban đầu SSE cho video ${videoId}:`, error);
    }

    console.log(`Client SSE đã kết nối vào phòng: ${videoId}. Tổng số client: ${clients.get(videoId)?.length}`);
};

/**
 * Xóa một client khỏi danh sách.
 */
export const removeSSEClient = (videoId: string, res: Response) => {
    const videoClients = clients.get(videoId);
    if (videoClients) {
        const index = videoClients.indexOf(res);
        if (index !== -1) {
            videoClients.splice(index, 1);
        }
        if (videoClients.length === 0) {
            clients.delete(videoId);
        }
    }
    console.log(`Client SSE đã ngắt kết nối khỏi phòng: ${videoId}`);
};

/**
 * Gửi dữ liệu SSE tới một client cụ thể.
 */
function sendSSE(res: Response, event: string, data: any) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Quảng bá dữ liệu SSE tới tất cả client trong một phòng.
 */
export const broadcastSSE = (videoId: string, event: string, data: any) => {
    console.log(`Broadcasting SSE event: ${event} to video: ${videoId}`);
    const videoClients = clients.get(videoId);
    if (videoClients) {
        videoClients.forEach((res) => {
            sendSSE(res, event, data);
        });
    }
};

/**
 * Lấy Top 5 từ Redis và gửi qua SSE.
 * Nếu Redis bị mất dữ liệu (key không tồn tại), khôi phục toàn bộ từ MongoDB.
 */
async function sendCurrentLeaderboard(videoId: string, specificRes?: Response) {
    try {
        const leaderboardKey = REDIS_KEYS.LEADERBOARD(videoId);

        // Kiểm tra xem key có tồn tại không trước khi lấy
        const exists = await redis.exists(leaderboardKey);

        // --- Khôi phục dữ liệu nếu Redis trống hoàn toàn (key không tồn tại) ---
        if (!exists) {
            console.log(`Redis leaderboard không tồn tại cho video ${videoId}. Đang khôi phục toàn bộ từ MongoDB...`);
            const allAggregates = await getToxicUserAggregates(videoId);

            if (allAggregates.length > 0) {
                const pipeline = redis.pipeline();
                for (const user of allAggregates) {
                    const userInfoKey = REDIS_KEYS.USER_INFO(user.author_id);
                    pipeline.zadd(leaderboardKey, user.toxic_count, user.author_id);
                    pipeline.hset(userInfoKey, {
                        name: user.author_name,
                        avatar: user.author_image
                    });
                    pipeline.expire(userInfoKey, REDIS_TTL.USER_INFO);
                }
                pipeline.expire(leaderboardKey, REDIS_TTL.LEADERBOARD);
                await pipeline.exec();
            }
        }

        // Lấy Top 5 user có toxic_count cao nhất
        const topUsersIds = await redis.zrevrange(leaderboardKey, 0, 4, "WITHSCORES");

        const leaderboard: UserInfo[] = [];
        if (topUsersIds && topUsersIds.length > 0) {
            for (let i = 0; i < topUsersIds.length; i += 2) {
                const authorId = topUsersIds[i];
                const toxicCount = parseInt(topUsersIds[i + 1]);
                const info = await redis.hgetall(REDIS_KEYS.USER_INFO(authorId));
                leaderboard.push({
                    author_id: authorId,
                    author_name: info.name || "Unknown",
                    author_image: info.avatar || "",
                    toxic_count: toxicCount
                });
            }
        }

        const currentLeaderboardStr = JSON.stringify(leaderboard);
        const prevLeaderboardStr = previousLeaderboards.get(videoId);
        const hasChanged = currentLeaderboardStr !== prevLeaderboardStr;

        if (hasChanged || specificRes) {
            previousLeaderboards.set(videoId, currentLeaderboardStr);
            if (specificRes) {
                sendSSE(specificRes, "leaderboard:update", leaderboard);
            } else {
                broadcastSSE(videoId, "leaderboard:update", leaderboard);
            }
        }
    } catch (error) {
        console.error("Lỗi khi gửi leaderboard SSE:", error);
    }
}

/**
 * Lắng nghe các thay đổi từ MongoDB Change Streams cho SSE.
 */
export const initSSERealtimeListener = () => {
    // 1. Lắng nghe collection 'comments'
    CommentModel.watch([{ $match: { operationType: "insert" } }]).on("change", (change: any) => {
        const newComment = change.fullDocument;
        if (newComment && newComment.video_id) {
            broadcastSSE(newComment.video_id, "new_comment", newComment);
        }
    });

    // 2. Lắng nghe collection 'metrics'
    MetricModel.watch(
        [{ $match: { operationType: { $in: ["update", "insert", "replace"] } } }],
        { fullDocument: "updateLookup" }
    ).on("change", (change: any) => {
        const updatedMetric = change.fullDocument;
        if (updatedMetric && updatedMetric.video_id) {
            broadcastSSE(updatedMetric.video_id, "metric_update", updatedMetric);
        }
    });

    // 3. Lắng nghe collection 'toxic_user_metrics'
    ToxicUserModel.watch(
        [{ $match: { operationType: { $in: ["insert", "update", "replace"] } } }],
        { fullDocument: "updateLookup" }
    ).on("change", async (change: any) => {
        const doc = change.fullDocument;
        if (!doc || !doc.video_id || !doc.author_id) return;

        const { video_id, author_id, author_name, author_image, toxic_count } = doc;
        const leaderboardKey = REDIS_KEYS.LEADERBOARD(video_id);
        const userInfoKey = REDIS_KEYS.USER_INFO(author_id);

        // --- Kiểm tra và Khôi phục nếu Redis mất dữ liệu ---
        const exists = await redis.exists(leaderboardKey);
        if (!exists) {
            // Nếu không tồn tại, hàm này sẽ kéo toàn bộ từ Mongo về Redis
            await sendCurrentLeaderboard(video_id);
            return;
        }

        // --- Cập nhật dữ liệu mới nhất vào Redis ---
        await redis.hset(userInfoKey, {
            name: author_name,
            avatar: author_image
        });
        await redis.zadd(leaderboardKey, toxic_count, author_id);

        // Cập nhật TTL cho video leaderboard và user info
        await redis.expire(leaderboardKey, REDIS_TTL.LEADERBOARD);
        await redis.expire(userInfoKey, REDIS_TTL.USER_INFO);

        // Phát cập nhật leaderboard mới nhất cho tất cả client
        await sendCurrentLeaderboard(video_id);
    });

    // 4. Lắng nghe Redis channel 'channel:crawler' để phát trạng thái crawler
    redisSub.subscribe("channel:crawler", (err) => {
        if (err) {
            console.error("Lỗi khi subscribe Redis channel:crawler:", err);
        }
    });

    redisSub.on("message", (channel, message) => {
        if (channel === "channel:crawler") {
            try {
                const data = JSON.parse(message);
                if (data.videoId) {
                    // Broadcast crawler status using videoId to match frontend SSE connection
                    broadcastSSE(data.videoId, "crawler_status", data);
                }
            } catch (error) {
                console.error("Lỗi xử lý tin nhắn channel:crawler:", error);
            }
        }
    });
};
