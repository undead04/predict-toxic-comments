import { Request, Response, NextFunction } from "express";
import { ResponseDTO } from "../model/response";
import { fetchChatMessages, getLiveChatId } from "../service/youtube-service";
import { AppError } from "../error/AppError";
import { extractVideoId } from "../utils/youtube.util";

const getChatLiveController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) {
      throw new AppError("Live Chat ID is required", 400);
    }
    const videoId = extractVideoId(url);
    const liveChatId = await getLiveChatId(videoId);
    if (!liveChatId) {
      throw new AppError("Live Chat ID not found for the provided video", 404);
    }
    fetchChatMessages(liveChatId).catch((err) => {
      console.error("Worker Crawl Error:", err);
    });
    const response = ResponseDTO.success<string>(
      "Live Chat ID retrieved successfully",
      200
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
export { getChatLiveController };
