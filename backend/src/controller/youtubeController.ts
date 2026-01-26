import { Request, Response, NextFunction } from "express";
import { ResponseDTO } from "../model/response";
import { crawlLiveChat, getLiveChatId, stopCrawlerService } from "../service/youtube-service";
import { AppError } from "../error/AppError";
import { extractVideoId } from "../utils/youtube.util";
import { acquireLockActiveCrawlers } from "../service/redis-service";
import { addSSEClient, removeSSEClient } from "../service/sse-service";


const getChatLiveController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) {
      throw new AppError("Video URL is required", 400);
    }

    const videoId = extractVideoId(url);
    const liveChatId = await getLiveChatId(videoId);

    if (!liveChatId) {
      throw new AppError("Live chat not found or stream is offline", 404);
    }

    const locked = await acquireLockActiveCrawlers(liveChatId);
    if (!locked) {
      res.status(200).json(ResponseDTO.success("Crawler already running", 200));
      return
    }
    crawlLiveChat(liveChatId, videoId)
      .catch((err) => {
        console.error("Worker Crawl Error:", err);
      })

    res
      .status(202)
      .json(ResponseDTO.success("Live chat crawler started successfully", 202));
  } catch (error) {
    next(error);
  }
};

const stopCrawlerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { url, action } = req.body;

    if (!url) {
      throw new AppError("Video URL is required", 400);
    }

    if (!action || !["stop"].includes(action)) {
      throw new AppError("Action must be 'stop' ", 400);
    }

    const videoId = extractVideoId(url);
    const liveChatId = await getLiveChatId(videoId);

    if (!liveChatId) {
      throw new AppError("Live chat not found for this URL", 404);
    }

    const message = await stopCrawlerService(liveChatId, videoId, action);
    res.status(200).json(ResponseDTO.success(message));

  } catch (error: any) {
    next(error);
  }
};


// ... existing code ...

const sseStreamEventsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { videoId } = req.params;
    if (!videoId) {
      throw new AppError("Video ID is required", 400);
    }

    // Thiết lập header cho SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Đăng ký client vào SSE Service
    await addSSEClient(videoId, res);

    // Xử lý khi client ngắt kết nối
    req.on("close", () => {
      removeSSEClient(videoId, res);
    });
  } catch (error) {
    next(error);
  }
};

export { getChatLiveController, stopCrawlerController, sseStreamEventsController };
