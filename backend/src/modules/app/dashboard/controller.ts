import type { Request, Response } from "express";
import { dashboardService } from "./service";
import logger from "../../../utils/logger";

class DashboardController {
  /**
   * Get complete dashboard data
   * GET /app/dashboard
   */
  async getDashboard(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const dashboard = await dashboardService.getDashboard(student.id, student.batchId);

      return res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      logger.error("DashboardController.getDashboard error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get dashboard: ${error}`,
      });
    }
  }

  /**
   * Get today's lectures
   * GET /app/dashboard/today-lectures
   */
  async getTodayLectures(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const lectures = await dashboardService.getTodayLectures(student.batchId);

      return res.status(200).json({
        success: true,
        data: lectures,
      });
    } catch (error) {
      logger.error("DashboardController.getTodayLectures error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get lectures: ${error}`,
      });
    }
  }

  /**
   * Get quick access counts
   * GET /app/dashboard/quick-access
   */
  async getQuickAccess(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const counts = await dashboardService.getQuickAccessCounts(student.id, student.batchId);

      return res.status(200).json({
        success: true,
        data: counts,
      });
    } catch (error) {
      logger.error("DashboardController.getQuickAccess error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get quick access: ${error}`,
      });
    }
  }
}

export const dashboardController = new DashboardController();
