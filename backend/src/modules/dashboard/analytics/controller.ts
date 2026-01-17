import type { Request, Response } from "express";
import AnalyticsService from "./service";

export default class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  async getTotalStudentsCountOfBatch(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const batchId = Number(req.params.batchId);
      if (!batchId) {
        return res.status(400).json({ error: "Invalid batchId parameter" });
      }
      const count = await this.analyticsService.getTotalStudentsCountOfBatch(
        batchId
      );
      return res.status(200).json({ totalStudents: count });
    } catch (error) {
      return res.status(500).json({ error: `Internal Server Error: ${error}` });
    }
  }

  async getTotalStudentsCount(req: Request, res: Response): Promise<Response> {
    try {
      const count = await this.analyticsService.getTotalStudentsCount();
      return res.status(200).json({ totalStudents: count });
    } catch (error) {
      return res.status(500).json({ error: `Internal Server Error: ${error}` });
    }
  }

  async getTotalBatchesCount(req: Request, res: Response): Promise<Response> {
    try {
      const count = await this.analyticsService.getTotalBatchesCount();
      return res.status(200).json({ totalBatches: count });
    } catch (error) {
      return res.status(500).json({ error: `Internal Server Error: ${error}` });
    }
  }

  async getAttendanceMatrixOfDay(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const batchId = Number(req.params.batchId);
      const dateParam = req.query.date as string;
      if (!batchId || !dateParam) {
        return res
          .status(400)
          .json({ error: "Invalid batchId parameter or date query" });
      }
      const date = new Date(dateParam);
      const attendanceMatrix =
        await this.analyticsService.getAttendanceMatrixOfDay(batchId, date);
      return res.status(200).json({ attendanceMatrix });
    } catch (error) {
      return res.status(500).json({ error: `Internal Server Error: ${error}` });
    }
  }

  async getAttendanceMatrixOfMonth(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const batchId = Number(req.params.batchId);
      const monthParam = req.query.month as string;
      const yearParam = req.query.year as string;
      if (!batchId || !monthParam || !yearParam) {
        return res
          .status(400)
          .json({ error: "Invalid batchId parameter, month or year query" });
      }
      const month = Number(monthParam);
      const year = Number(yearParam);
      const attendanceMatrix =
        await this.analyticsService.getAttendanceMatrixOfMonth(
          batchId,
          month,
          year
        );
      return res.status(200).json({ attendanceMatrix });
    } catch (error) {
      return res.status(500).json({ error: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Get student enrollment trends
   * GET /analytics/enrollment-trends?months=12
   */
  async getEnrollmentTrends(req: Request, res: Response): Promise<Response> {
    try {
      const months = Number(req.query.months) || 12;
      const trends = await this.analyticsService.getEnrollmentTrends(months);
      return res.status(200).json({
        success: true,
        message: "Enrollment trends retrieved successfully",
        data: trends,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Failed to get enrollment trends: ${error}`,
      });
    }
  }

  /**
   * Get attendance trends (daily)
   * GET /analytics/attendance-trends?days=30&batchId=1
   */
  async getAttendanceTrends(req: Request, res: Response): Promise<Response> {
    try {
      const days = Number(req.query.days) || 30;
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
      const trends = await this.analyticsService.getAttendanceTrends(days, batchId);
      return res.status(200).json({
        success: true,
        message: "Attendance trends retrieved successfully",
        data: trends,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Failed to get attendance trends: ${error}`,
      });
    }
  }

  /**
   * Get monthly attendance trends
   * GET /analytics/monthly-attendance-trends?months=6&batchId=1
   */
  async getMonthlyAttendanceTrends(req: Request, res: Response): Promise<Response> {
    try {
      const months = Number(req.query.months) || 6;
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
      const trends = await this.analyticsService.getMonthlyAttendanceTrends(months, batchId);
      return res.status(200).json({
        success: true,
        message: "Monthly attendance trends retrieved successfully",
        data: trends,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Failed to get monthly attendance trends: ${error}`,
      });
    }
  }

  /**
   * Get comprehensive dashboard stats
   * GET /analytics/dashboard-stats
   */
  async getDashboardStats(req: Request, res: Response): Promise<Response> {
    try {
      const stats = await this.analyticsService.getDashboardStats();
      return res.status(200).json({
        success: true,
        message: "Dashboard stats retrieved successfully",
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Failed to get dashboard stats: ${error}`,
      });
    }
  }

  /**
   * Get batch-wise student distribution
   * GET /analytics/batch-distribution
   */
  async getBatchDistribution(req: Request, res: Response): Promise<Response> {
    try {
      const distribution = await this.analyticsService.getBatchDistribution();
      return res.status(200).json({
        success: true,
        message: "Batch distribution retrieved successfully",
        data: distribution,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Failed to get batch distribution: ${error}`,
      });
    }
  }

  /**
   * Get recent activities
   * GET /analytics/recent-activities?limit=10
   */
  async getRecentActivities(req: Request, res: Response): Promise<Response> {
    try {
      const limit = Number(req.query.limit) || 10;
      const activities = await this.analyticsService.getRecentActivities(limit);
      return res.status(200).json({
        success: true,
        message: "Recent activities retrieved successfully",
        data: activities,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Failed to get recent activities: ${error}`,
      });
    }
  }
}
