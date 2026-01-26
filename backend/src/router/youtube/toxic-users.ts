import express from "express";
import { getTopToxicUsersController } from "../../controller/toxicUserController";

const router = express.Router();

/**
 * Route to fetch top 5 toxic users for a video.
 * GET /api/youtube/toxic-users/top/:videoId
 */
router.get("/top/:videoId", getTopToxicUsersController);

export default router;
