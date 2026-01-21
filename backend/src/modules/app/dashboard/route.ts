import { Router } from "express";
import { dashboardController } from "./controller";

const router = Router();

router.get("/", dashboardController.getDashboard.bind(dashboardController));
router.get("/today-lectures", dashboardController.getTodayLectures.bind(dashboardController));
router.get("/quick-access", dashboardController.getQuickAccess.bind(dashboardController));

export default router;
