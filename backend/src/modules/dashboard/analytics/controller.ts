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
}
