import type { Request, Response } from "express";
import { feesService } from "./service";
import logger from "../../../utils/logger";

class FeesController {
  /**
   * Get fee receipts for student
   * GET /app/fees/receipts
   */
  async getFeeReceipts(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const receipts = await feesService.getFeeReceipts(student.id);

      return res.status(200).json({
        success: true,
        data: receipts,
      });
    } catch (error) {
      logger.error("FeesController.getFeeReceipts error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get fee receipts: ${error}`,
      });
    }
  }

  /**
   * Get fees summary for student
   * GET /app/fees/summary
   */
  async getFeesSummary(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const summary = await feesService.getFeesSummary(student.id);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error("FeesController.getFeesSummary error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get fees summary: ${error}`,
      });
    }
  }
}

export const feesController = new FeesController();
