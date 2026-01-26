import { Request, Response, NextFunction } from "express";
import { ResponseDTO } from "../model/response";
import { getMetricsByVideoId } from "../service/stream-metric-service";
import { AppError } from "../error/AppError";

/**
 * Controller lấy danh sách thống kê theo Video ID.
 */
export const getStreamMetricsController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { videoId } = req.params;

        if (!videoId) {
            throw new AppError("Video ID is required", 400);
        }

        const metrics = await getMetricsByVideoId(videoId);

        res.status(200).json(
            ResponseDTO.successData(metrics, "Fetch stream metrics successfully", 200)
        );
    } catch (error) {
        next(error);
    }
};
