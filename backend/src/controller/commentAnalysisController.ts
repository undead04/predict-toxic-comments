import { Request, Response, NextFunction } from "express";
import { ResponseDTO } from "../model/response";
import { getCommentsByVideoId } from "../service/comment-analysis-service";
import { AppError } from "../error/AppError";

/**
 * Controller lấy danh sách phân tích bình luận theo Video ID.
 */
export const getCommentAnalysisController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { videoId } = req.params;

        if (!videoId) {
            throw new AppError("Video ID is required", 400);
        }

        const comments = await getCommentsByVideoId(videoId);

        res.status(200).json(
            ResponseDTO.withData(comments, "Fetch comment analysis successfully", 200)
        );
    } catch (error) {
        next(error);
    }
};
