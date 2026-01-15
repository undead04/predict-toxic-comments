import express, { Request, Response, NextFunction } from "express";
import { getChatLiveController } from "../../controller/youtubeController";
const router = express.Router();
router.post("/live-chat", getChatLiveController);
export default router;
