import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import complaintsRouter from "./complaints";
import commentsRouter from "./comments";
import adminRouter from "./admin";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(complaintsRouter);
router.use(commentsRouter);
router.use(adminRouter);
router.use(usersRouter);

export default router;
