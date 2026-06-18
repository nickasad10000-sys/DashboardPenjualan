import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lumajangRouter from "./lumajang";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lumajangRouter);

export default router;
