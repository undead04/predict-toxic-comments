import { ToxicUserModel } from "../model/ToxicUserMetric";
import { PipelineStage } from 'mongoose';
/**
 * Interface cho thông tin người dùng trong leaderboard.
 */
export interface UserInfo {
    author_id: string;
    author_name: string;
    author_image: string;
    toxic_count: number;
}
/**
 * Service to fetch top 5 users with the most toxic comments for a specific video.
 */
export const getTopToxicUsers = async (videoId: string): Promise<UserInfo[]> => {
    const pipeline: PipelineStage[] = [
        {
            $match: { video_id: videoId },
        },
        {
            $group: {
                _id: "$author_id",
                author_name: { $first: "$author_name" },
                author_image: { $first: "$author_image" },
                toxic_count: { $sum: "$toxic_count" },
            },
        },
        {
            $sort: { toxic_count: -1 },
        },
        {
            $limit: 5,
        },
        {
            $project: {
                _id: 0,
                author_id: "$_id",
                author_name: 1,
                author_image: 1,
                toxic_count: 1,
            },
        },
    ];

    const results = await ToxicUserModel.aggregate(pipeline);
    return results;
};

/**
 * Lấy toàn bộ danh sách người dùng và tổng số toxic_count của họ cho một videoId.
 * Dùng để khôi phục dữ liệu vào Redis khi cần.
 */
export const getToxicUserAggregates = async (videoId: string): Promise<UserInfo[]> => {
    const pipeline: PipelineStage[] = [
        {
            $match: { video_id: videoId },
        },
        {
            $group: {
                _id: "$author_id",
                author_name: { $first: "$author_name" },
                author_image: { $first: "$author_image" },
                toxic_count: { $sum: "$toxic_count" },
            },
        },
        {
            $project: {
                _id: 0,
                author_id: "$_id",
                author_name: 1,
                author_image: 1,
                toxic_count: 1,
            },
        },
    ];

    const results = await ToxicUserModel.aggregate(pipeline);
    return results;
};
