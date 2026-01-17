import { Router } from "express";
import { isAdmin, isAuthenticated } from "../../auth/middleware";
import AnalyticsController from "./controller";

const router = Router();
router.use(isAuthenticated, isAdmin);

const controller = new AnalyticsController();

// =====================
// COUNT ENDPOINTS
// =====================
router.get("/batch-count", controller.getTotalBatchesCount.bind(controller));
router.get("/student-count", controller.getTotalStudentsCount.bind(controller));
router.get(
  "/batch/:batchId/student-count",
  controller.getTotalStudentsCountOfBatch.bind(controller)
);

// =====================
// ATTENDANCE MATRIX ENDPOINTS
// =====================
router.get(
  "/batch/:batchId/attendance/day",
  controller.getAttendanceMatrixOfDay.bind(controller)
);
router.get(
  "/batch/:batchId/attendance/month",
  controller.getAttendanceMatrixOfMonth.bind(controller)
);

// =====================
// DASHBOARD & TRENDS ENDPOINTS
// =====================
router.get("/dashboard-stats", controller.getDashboardStats.bind(controller));
router.get("/enrollment-trends", controller.getEnrollmentTrends.bind(controller));
router.get("/attendance-trends", controller.getAttendanceTrends.bind(controller));
router.get("/monthly-attendance-trends", controller.getMonthlyAttendanceTrends.bind(controller));
router.get("/batch-distribution", controller.getBatchDistribution.bind(controller));
router.get("/recent-activities", controller.getRecentActivities.bind(controller));

export default router;
