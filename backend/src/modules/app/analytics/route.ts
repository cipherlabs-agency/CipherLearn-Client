import { Router } from "express";
import { isTeacher, isAdmin, requireTeacherPermission } from "../../auth/middleware";
import { appReadRateLimiter } from "../../../middleware/rateLimiter";
import { appAnalyticsController } from "./controller";

/**
 * /api/app/analytics — teacher/admin analytics for the mobile app.
 * Reuses the dashboard AnalyticsService. Teacher access requires the
 * `canViewAnalytics` permission; admin always passes.
 */
const router = Router();

router.get(
  "/overview",
  isTeacher,
  requireTeacherPermission("canViewAnalytics"),
  appReadRateLimiter,
  appAnalyticsController.getOverview.bind(appAnalyticsController)
);

router.get(
  "/attendance-trends",
  isTeacher,
  requireTeacherPermission("canViewAnalytics"),
  appReadRateLimiter,
  appAnalyticsController.getAttendanceTrends.bind(appAnalyticsController)
);

router.get(
  "/recent-activities",
  isTeacher,
  requireTeacherPermission("canViewAnalytics"),
  appReadRateLimiter,
  appAnalyticsController.getRecentActivities.bind(appAnalyticsController)
);

// Admin-only org-wide views
router.get(
  "/enrollment-trends",
  isAdmin,
  appReadRateLimiter,
  appAnalyticsController.getEnrollmentTrends.bind(appAnalyticsController)
);

router.get(
  "/batch-distribution",
  isAdmin,
  appReadRateLimiter,
  appAnalyticsController.getBatchDistribution.bind(appAnalyticsController)
);

export default router;
