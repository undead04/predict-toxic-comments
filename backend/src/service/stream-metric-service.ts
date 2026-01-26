import { MetricModel, ILiveStreamMetric } from "../model/LiveStreamMetric";

/**
 * Dịch vụ xử lý thống kê luồng trực tiếp.
 */
export const getMetricsByVideoId = async (videoId: string): Promise<Partial<ILiveStreamMetric>[]> => {
    // Lấy tất cả record theo videoId
    // Chỉ select các trường: _id, video_id, window_start, total_comments, toxic_comments, toxic_rate, unique_users
    const metrics = await MetricModel
        .find({ video_id: videoId })
        .select({
            _id: 1,
            video_id: 1,
            window_start: 1,
            total_comments: 1,
            toxic_comments: 1,
            toxic_rate: 1,
            unique_users: 1,
        })
        .sort({ window_start: 1 }) // Sắp xếp theo thời gian tăng dần
        .lean();

    return metrics;
};
