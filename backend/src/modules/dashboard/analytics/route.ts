import { Router } from "express";
import { isAdmin, isAuthenticated } from "../../auth/middleware";
import AnalyticsController from "./controller";

const router = Router();
router.use(isAuthenticated, isAdmin);

const controller = new AnalyticsController();

router.get("/batch-count", controller.getTotalBatchesCount.bind(controller));
router.get("/student-count", controller.getTotalStudentsCount.bind(controller));
router.get(
  "/batch/:batchId/student-count",
  controller.getTotalStudentsCountOfBatch.bind(controller)
);
router.get(
  "/batch/:batchId/attendance/day",
  controller.getAttendanceMatrixOfDay.bind(controller)
);
router.get(
  "/batch/:batchId/attendance/month",
  controller.getAttendanceMatrixOfMonth.bind(controller)
);

export default router;
