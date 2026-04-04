import { Router, type IRouter } from "express";
import healthRouter from "./health";
import learnersRouter from "./odyssey/learners";
import adventuresRouter from "./odyssey/adventures";
import walletRouter from "./odyssey/wallet";
import rewardsRouter from "./odyssey/rewards";
import aiRouter from "./odyssey/ai";
import uploadRouter from "./odyssey/upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/learners", learnersRouter);
router.use("/adventures", adventuresRouter);
router.use("/wallet", walletRouter);
router.use("/rewards", rewardsRouter);
router.use("/ai", aiRouter);
router.use("/upload", uploadRouter);

export default router;
