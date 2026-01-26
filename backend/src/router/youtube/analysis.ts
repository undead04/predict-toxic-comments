import express from "express";
import { getCommentAnalysisController } from "../../controller/commentAnalysisController";

const router = express.Router();

/**
 * Route lấy danh sách phân tích bình luận theo Video ID.
 * GET /api/youtube/analysis/:videoId
 */
router.get("/:videoId", getCommentAnalysisController);

export default router;
