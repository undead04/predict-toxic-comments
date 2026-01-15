import expess from "express";
const router = expess.Router();
import youtubeRouter from "./youtube/index";
router.use("/youtube", youtubeRouter);
export default router;
