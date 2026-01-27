import { CommentModel } from "../model/LiveCommentAnalysis";
import { ILiveCommentAnalysis } from "../model/LiveCommentAnalysis";


/**
 * Dịch vụ xử lý phân tích bình luận trực tiếp.
 */
export const getCommentsByVideoId = async (videoId: string): Promise<Partial<ILiveCommentAnalysis>[]> => {
    // Lấy tất cả comment theo videoId
    // Chỉ select các trường: _id, comment_id, message, toxic_label, recommended_action, published_at
    const comments = await CommentModel
        .find({ video_id: videoId })
        .select({
            _id: 1,
            comment_id: 1,
            author_name: 1,
            message: 1,
            toxic_label: 1,
            toxic_category: 1,
            recommended_action: 1,
            published_at: 1,
        })
        .limit(100)
        .sort({ published_at: -1 }) // Sắp xếp theo thời gian tăng dần
        .lean();

    return comments;
};
