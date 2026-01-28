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
 * Buffer for batching new comments to save bandwidth.
 * Key: videoId
 * Value: Array of comments
 */
const commentBuffers = new Map<string, any[]>();
const COMMENT_BATCH_SIZE = 10;
const COMMENT_FLUSH_INTERVAL = 10000; // 1s

/**
 * Bộ nhớ đệm (Cache) để lưu trữ trạng thái trước đó của leaderboard cho mỗi video.
 */
const previousLeaderboards = new Map<string, string>();

// redisSub is removed in favor of Redis Streams reading

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
        await sendInitialCrawlerStatus(videoId, res);
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
 * Lấy trạng thái crawler cuối cùng từ Redis Stream và gửi cho client.
 */
async function sendInitialCrawlerStatus(videoId: string, res: Response) {
    try {
        // Lấy các sự kiện gần đây từ stream
        const lastEvents: any = await redis.xrevrange(REDIS_KEYS.STREAM_CRAWLER, "+", "-", "COUNT", 100);

        if (lastEvents && lastEvents.length > 0) {
            // Tìm sự kiện cuối cùng khớp với videoId
            for (const event of lastEvents) {
                const dataStr = event[1][1];
                const data = JSON.parse(dataStr);
                if (data.videoId === videoId) {
                    sendSSE(res, "crawler_status", data);
                    break;
                }
            }
        }
    } catch (error) {
        console.error(`Lỗi khi gửi trạng thái crawler ban đầu cho video ${videoId}:`, error);
    }
}

/**
 * Lắng nghe các thay đổi từ MongoDB Change Streams cho SSE.
 */
export const initSSERealtimeListener = () => {
    const pipelineComment = [
        { $match: { operationType: "insert" } },
        {
            $project: {
                "fullDocument._id": 1,
                "fullDocument.author_name": 1,
                "fullDocument.author_image": 1,
                "fullDocument.message": 1,
                "fullDocument.video_id": 1,
                "fullDocument.comment_id": 1,
                "fullDocument.published_at": 1,
                "fullDocument.toxic_label": 1,
                "fullDocument.toxic_category": 1,
                "fullDocument.recommended_action": 1,
            }
        }
    ];
    // 1. Lắng nghe collection 'comments'
    CommentModel.watch(pipelineComment).on("change", (change: any) => {
        const newComment = change.fullDocument;
        if (newComment && newComment.video_id) {
            const videoId = newComment.video_id;

            // Lấy hoặc tạo buffer cho videoId này
            if (!commentBuffers.has(videoId)) {
                commentBuffers.set(videoId, []);

                // Set timeout để flush buffer sau một khoảng thời gian
                setTimeout(() => flushCommentBuffer(videoId), COMMENT_FLUSH_INTERVAL);
            }

            const buffer = commentBuffers.get(videoId)!;
            buffer.push(newComment);

            // Nếu buffer đạt kích thước tối đa, flush ngay lập tức
            if (buffer.length >= COMMENT_BATCH_SIZE) {
                flushCommentBuffer(videoId);
            }
        }
    });
    const pipelineMetric = [
        { $match: { operationType: { $in: ["update", "insert", "replace"] } } },
        { $project: { "fullDocument.video_id": 1, "fullDocument.window_start": 1, "fullDocument.total_comments": 1, "fullDocument.toxic_count": 1, "fullDocument.unique_viewers": 1 } }
    ];
    // 2. Lắng nghe collection 'metrics'
    MetricModel.watch(pipelineMetric).on("change", (change: any) => {
        const updatedMetric = change.fullDocument
        if (updatedMetric && updatedMetric.video_id) {
            broadcastSSE(updatedMetric.video_id, "metric_update", updatedMetric);
        }
    });

    // 3. Lắng nghe collection 'toxic_user_metrics'
    const pipelineToxicUser = [
        { $match: { operationType: { $in: ["insert", "update", "replace"] } } },
        { $project: { "fullDocument.video_id": 1, "fullDocument.author_id": 1, "fullDocument.author_name": 1, "fullDocument.author_image": 1, "fullDocument.toxic_count": 1 } }
    ];
    ToxicUserModel.watch(pipelineToxicUser).on("change", async (change: any) => {
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

    // 4. Lắng nghe Redis Stream 'stream:crawler' để phát trạng thái crawler
    listenToCrawlerStream();
};

/**
 * Lắng nghe Redis Stream và broadcast tới các client SSE.
 */
async function listenToCrawlerStream() {
    let lastId = "$"; // Bắt đầu lắng nghe từ những tin nhắn mới nhất sau khi khởi động

    // Kiểm tra xem stream có tồn tại không và lấy ID cuối cùng nếu cần
    // Ở đây dùng "$" là đủ để nhận các tin nhắn mới.

    while (true) {
        try {
            // Đọc từ stream, block tối đa 5 giây nếu không có tin nhắn mới
            const results = await redis.xread("BLOCK", 5000, "STREAMS", REDIS_KEYS.STREAM_CRAWLER, lastId);

            if (results) {
                const [streamName, messages] = results[0];
                for (const message of messages) {
                    const [id, [field, dataStr]] = message;
                    lastId = id;

                    try {
                        const data = JSON.parse(dataStr);
                        if (data.videoId) {
                            broadcastSSE(data.videoId, "crawler_status", data);
                        }
                    } catch (err) {
                        console.error("Lỗi parse dữ liệu từ Redis Stream:", err);
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi khi đọc từ Redis Stream:", error);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Đợi trước khi thử lại
        }
    }
}
/**
 * Gửi toàn bộ comment trong buffer và xóa buffer.
 */
function flushCommentBuffer(videoId: string) {
    const buffer = commentBuffers.get(videoId);
    if (buffer && buffer.length > 0) {
        broadcastSSE(videoId, "new_comments", buffer);
        commentBuffers.delete(videoId);
    }
}
