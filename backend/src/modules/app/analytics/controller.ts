import { Request, Response } from "express";
import AnalyticsService from "../../dashboard/analytics/service";
import { logger } from "../../../utils/logger";

/**
 * App Analytics controller — exposes the existing dashboard AnalyticsService
 * under /api/app/analytics for the mobile teacher/admin dashboards.
 * Teacher access is gated by the `canViewAnalytics` permission (see route.ts).
 */
const analyticsService = new AnalyticsService();

export class AppAnalyticsController {
  // GET /app/analytics/overview
  async getOverview(_req: Request, res: Response) {
    try {
      const data = await analyticsService.getDashboardStats();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppAnalytics.getOverview error:", error);
      return res.status(500).json({ success: false, message: "Failed to load analytics overview" });
    }
  }

  // GET /app/analytics/attendance-trends?days=30&batchId=
  async getAttendanceTrends(req: Request, res: Response) {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
      const data = await analyticsService.getAttendanceTrends(days, batchId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppAnalytics.getAttendanceTrends error:", error);
      return res.status(500).json({ success: false, message: "Failed to load attendance trends" });
    }
  }

  // GET /app/analytics/enrollment-trends?months=12  (admin)
  async getEnrollmentTrends(req: Request, res: Response) {
    try {
      const months = req.query.months ? Number(req.query.months) : 12;
      const data = await analyticsService.getEnrollmentTrends(months);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppAnalytics.getEnrollmentTrends error:", error);
      return res.status(500).json({ success: false, message: "Failed to load enrollment trends" });
    }
  }

  // GET /app/analytics/batch-distribution  (admin)
  async getBatchDistribution(_req: Request, res: Response) {
    try {
      const data = await analyticsService.getBatchDistribution();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppAnalytics.getBatchDistribution error:", error);
      return res.status(500).json({ success: false, message: "Failed to load batch distribution" });
    }
  }

  // GET /app/analytics/recent-activities?limit=10
  async getRecentActivities(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const data = await analyticsService.getRecentActivities(limit);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppAnalytics.getRecentActivities error:", error);
      return res.status(500).json({ success: false, message: "Failed to load recent activities" });
    }
  }
}

export const appAnalyticsController = new AppAnalyticsController();
