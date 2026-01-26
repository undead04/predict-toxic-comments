import express from "express";
import { getChatLiveController, stopCrawlerController, sseStreamEventsController } from "../../controller/youtubeController";
import analysisRouter from "./analysis";
import metricsRouter from "./metrics";
import toxicUsersRouter from "./toxic-users";

const router = express.Router();

router.post("/live-chat", getChatLiveController);
router.post("/stop-crawler", stopCrawlerController);
router.get("/events/:videoId", sseStreamEventsController);
router.use("/analysis", analysisRouter);
router.use("/metrics", metricsRouter);
router.use("/toxic-users", toxicUsersRouter);

export default router;
