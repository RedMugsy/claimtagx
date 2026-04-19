import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assetsRouter from "./assets";
import meRouter from "./me";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(assetsRouter);

export default router;
