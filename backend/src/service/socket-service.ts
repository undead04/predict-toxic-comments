import { Server } from "socket.io";
import { redis } from "./redis-service";
import { getCommentsByVideoId } from "./comment-analysis-service";
import { getMetricsByVideoId } from "./stream-metric-service";
import { CommentModel } from "../model/LiveCommentAnalysis";
import { MetricModel } from "../model/LiveStreamMetric";
import { ToxicUserModel } from "../model/ToxicUserMetric";
import { UserInfo } from "./toxic-user-service";



/**
 * Bộ nhớ đệm (Cache) để lưu trữ trạng thái trước đó của leaderboard cho mỗi video.
 * Key: videoId (string)
 * Value: Dạng chuỗi JSON của mảng UserInfo[]
 */
const previousLeaderboards = new Map<string, string>();

/**
 * Khởi tạo Dịch vụ Socket.IO.
 * @param io Instance của Server Socket.IO.
 */
export const initSocket = (io: Server) => {
    io.on("connection", (socket) => {
        console.log("Client Frontend đã kết nối:", socket.id);

        /**
         * Khi người dùng vào trang live stream hoặc video cụ thể, họ sẽ join vào room.
         */
        socket.on("join_live", async (videoId: string) => {
            socket.join(`live:${videoId}`);
            console.log(`Client ${socket.id} đã tham gia phòng: live:${videoId}`);

            // 1. Lấy leaderboard hiện tại từ Redis và gửi cho user mới join
            await emitCurrentLeaderboard(io, videoId, socket.id);

            // 2. Lấy toàn bộ comments cũ từ MongoDB và gửi cho user mới join
            try {
                const initialComments = await getCommentsByVideoId(videoId);
                socket.emit("initial_comments", initialComments);
            } catch (error) {
                console.error(`Lỗi khi lấy initial comments cho video ${videoId}:`, error);
            }

            // 3. Lấy toàn bộ metrics cũ từ MongoDB và gửi cho user mới join
            try {
                const initialMetrics = await getMetricsByVideoId(videoId);
                socket.emit("initial_metrics", initialMetrics);
            } catch (error) {
                console.error(`Lỗi khi lấy initial metrics cho video ${videoId}:`, error);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client Frontend đã ngắt kết nối:", socket.id);
        });
    });
};

/**
 * Lắng nghe các thay đổi từ MongoDB Change Streams.
 * @param io Instance của Server Socket.IO.
 */
export const initMongoListener = (io: Server) => {
    // 1. Lắng nghe collection 'comments' (Sự kiện insert)
    try {
        const commentStream = CommentModel.watch([{ $match: { operationType: "insert" } }]);

        commentStream.on("change", (change: any) => {
            const newComment = change.fullDocument;
            if (newComment && newComment.video_id) {
                io.to(`live:${newComment.video_id}`).emit("new_comment", newComment);
            }
        });
        commentStream.on("error", (err) => console.error("Lỗi Stream Comments:", err));
    } catch (error) {
        console.error("Không thể khởi tạo Stream Comments:", error);
    }

    // 2. Lắng nghe collection 'metrics' (Sự kiện update/insert/replace)
    try {
        const metricStream = MetricModel.watch(
            [{ $match: { operationType: { $in: ["update", "insert", "replace"] } } }],
            { fullDocument: "updateLookup" }
        );

        metricStream.on("change", (change: any) => {
            const updatedMetric = change.fullDocument;
            if (updatedMetric && updatedMetric.video_id) {
                io.to(`live:${updatedMetric.video_id}`).emit("metric_update", updatedMetric);
            }
        });
        metricStream.on("error", (err) => console.error("Lỗi Stream Metrics:", err));
    } catch (error) {
        console.error("Không thể khởi tạo Stream Metrics:", error);
    }

    // 3. Lắng nghe collection 'toxic_user_metrics' 
    // Khi có dữ liệu mới -> Bỏ vào Redis -> Tính toán Leaderboard -> Gửi lên Socket
    try {
        const toxicStream = ToxicUserModel.watch(
            [{ $match: { operationType: { $in: ["insert", "update", "replace"] } } }],
            { fullDocument: "updateLookup" }
        );

        toxicStream.on("change", async (change: any) => {
            const doc = change.fullDocument;
            if (!doc || !doc.video_id || !doc.author_id) return;

            const { video_id, author_id, author_name, author_image, toxic_count } = doc;

            // Cập nhật thông tin người dùng vào Redis Hash (để lấy name/avatar khi cần)
            const userInfoKey = `user:info:${author_id}`;
            await redis.hset(userInfoKey, {
                name: author_name,
                avatar: author_image
            });

            // Cập nhật điểm số toxic vào Redis Sorted Set (ZSET) cho video này
            const leaderboardKey = `leaderboard:scores:${video_id}`;
            // Sử dụng ZSET để lưu toxic_count, tự động ranking
            await redis.zadd(leaderboardKey, toxic_count, author_id);

            // Sau khi cập nhật xong Redis, lấy Top 5 mới nhất và gửi qua Socket
            await emitCurrentLeaderboard(io, video_id);
        });

        toxicStream.on("error", (err) => console.error("Lỗi Stream Toxic Metrics:", err));
    } catch (error) {
        console.error("Không thể khởi tạo Stream Toxic Metrics:", error);
    }
};

/**
 * Lấy Top 5 từ Redis và phát (emit) qua Socket.IO.
 * @param io Instance của Server Socket.IO.
 * @param videoId ID của video/live stream.
 * @param specificSocketId Nếu có, chỉ gửi cho socket này.
 */
async function emitCurrentLeaderboard(io: Server, videoId: string, specificSocketId?: string) {
    try {
        const leaderboardKey = `leaderboard:scores:${videoId}`;
        // Lấy Top 5 user có toxic_count cao nhất (giảm dần)
        const topUsersIds = await redis.zrevrange(leaderboardKey, 0, 4, "WITHSCORES");

        if (!topUsersIds || topUsersIds.length === 0) {
            const emptyResult: UserInfo[] = [];
            if (specificSocketId) {
                io.to(specificSocketId).emit("leaderboard:update", emptyResult);
            } else {
                io.to(`live:${videoId}`).emit("leaderboard:update", emptyResult);
            }
            return;
        }

        const leaderboard: UserInfo[] = [];
        for (let i = 0; i < topUsersIds.length; i += 2) {
            const authorId = topUsersIds[i];
            const toxicCount = parseInt(topUsersIds[i + 1]);

            // Lấy thêm name và avatar từ Redis Hash
            const info = await redis.hgetall(`user:info:${authorId}`);
            leaderboard.push({
                author_id: authorId,
                author_name: info.name || "Unknown",
                author_image: info.avatar || "",
                toxic_count: toxicCount
            });
        }

        // --- Tối ưu hóa: Chỉ emit nếu có thay đổi ---
        const currentLeaderboardStr = JSON.stringify(leaderboard);
        const prevLeaderboardStr = previousLeaderboards.get(videoId);
        const hasChanged = currentLeaderboardStr !== prevLeaderboardStr;

        if (hasChanged || specificSocketId) {
            // Cập nhật cache
            previousLeaderboards.set(videoId, currentLeaderboardStr);

            if (specificSocketId) {
                // Gửi riêng cho người mới join
                io.to(specificSocketId).emit("leaderboard:update", leaderboard);
            } else {
                // Phát (broadcast) cho tất cả mọi người trong phòng
                io.to(`live:${videoId}`).emit("leaderboard:update", leaderboard);
            }
            console.log(`Đã phát cập nhật leaderboard cho video ${videoId}`);
        }
    } catch (error) {
        console.error("Lỗi khi emit leaderboard:", error);
    }
}
