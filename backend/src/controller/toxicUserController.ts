import { Request, Response, NextFunction } from "express";
import { ResponseDTO } from "../model/response";
import { getTopToxicUsers } from "../service/toxic-user-service";
import { AppError } from "../error/AppError";

/**
 * Controller to fetch top 5 toxic users for a video.
 */
export const getTopToxicUsersController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { videoId } = req.params;

        if (!videoId) {
            throw new AppError("Video ID is required", 400);
        }

        const topUsers = await getTopToxicUsers(videoId);

        res.status(200).json(
            ResponseDTO.withData(topUsers, "Fetch top toxic users successfully", 200)
        );
    } catch (error) {
        next(error);
    }
};
