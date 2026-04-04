import { Router, type IRouter } from "express";
import healthRouter from "./health";
import learnersRouter from "./odyssey/learners";
import adventuresRouter from "./odyssey/adventures";
import walletRouter from "./odyssey/wallet";
import rewardsRouter from "./odyssey/rewards";
import aiRouter from "./odyssey/ai";
import uploadRouter from "./odyssey/upload";
import voyagePathsRouter from "./odyssey/voyage-paths";
import parentsRouter from "./odyssey/parents";
import classesRouter from "./odyssey/classes";
import announcementsRouter from "./odyssey/announcements";
import explorerLogsRouter from "./odyssey/explorer-logs";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/learners", learnersRouter);
router.use("/adventures", adventuresRouter);
router.use("/wallet", walletRouter);
router.use("/rewards", rewardsRouter);
router.use("/ai", aiRouter);
router.use("/upload", uploadRouter);
router.use("/voyage-paths", voyagePathsRouter);
router.use("/parents", parentsRouter);
router.use("/classes", classesRouter);
router.use("/announcements", announcementsRouter);
router.use("/explorer-logs", explorerLogsRouter);

export default router;
