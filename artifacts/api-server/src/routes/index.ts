import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assetsRouter from "./assets";
import meRouter from "./me";
import invitationsRouter from "./invitations";
import shiftsRouter from "./shifts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(invitationsRouter);
router.use(shiftsRouter);
router.use(assetsRouter);

export default router;
