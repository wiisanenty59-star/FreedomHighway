import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import categoriesRouter from "./categories";
import locationsRouter from "./locations";
import forumRouter from "./forum";
import invitesRouter from "./invites";
import adminCategoriesRouter from "./admin-categories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(categoriesRouter);
router.use(locationsRouter);
router.use(forumRouter);
router.use(invitesRouter);
router.use(adminCategoriesRouter);

export default router;
