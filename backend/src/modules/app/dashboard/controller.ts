import type { Request, Response } from "express";
import { dashboardService } from "./service";
import logger from "../../../utils/logger";
import { log } from "../../../utils/logtail";

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

      const dashboard = await dashboardService.getDashboard(student.id, student.batchId, req.user?.id);

      return res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      log("error", "app.dashboard.status failed", { err: error instanceof Error ? error.message : String(error) });
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

      const { lectures, nextClass } = await dashboardService.getTodayLectures(student.batchId);

      return res.status(200).json({
        success: true,
        data: { lectures, nextClass },
      });
    } catch (error) {
      log("error", "app.dashboard.status failed", { err: error instanceof Error ? error.message : String(error) });
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
      log("error", "app.dashboard.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("DashboardController.getQuickAccess error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get quick access: ${error}`,
      });
    }
  }

  /**
   * Get teacher dashboard data
   * GET /app/teacher/dashboard
   */
  async getTeacherDashboard(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Teacher not authenticated",
        });
      }

      const dashboard = await dashboardService.getTeacherDashboard(user.id);

      return res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      logger.error("DashboardController.getTeacherDashboard error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get teacher dashboard: ${error}`,
      });
    }
  }
}

export const dashboardController = new DashboardController();
