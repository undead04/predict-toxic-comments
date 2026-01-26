import express from "express";
import { getStreamMetricsController } from "../../controller/streamMetricController";

const router = express.Router();

/**
 * Route lấy danh sách thống kê theo Video ID.
 * GET /api/youtube/metrics/:videoId
 */
router.get("/:videoId", getStreamMetricsController);

export default router;
