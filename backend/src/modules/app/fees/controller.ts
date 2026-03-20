import type { Request, Response } from "express";
import { feesService } from "./service";
import logger from "../../../utils/logger";
import { log } from "../../../utils/logtail";

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
      log("error", "app.fees.status failed", { err: error instanceof Error ? error.message : String(error) });
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
      log("error", "app.fees.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("FeesController.getFeesSummary error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get fees summary: ${error}`,
      });
    }
  }
  /**
   * Get fee structures for student's batch
   * GET /app/fees/structures
   */
  async getFeeStructures(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      if (!student.batchId) {
        return res.status(400).json({
          success: false,
          message: "Student is not assigned to a batch",
        });
      }

      const structures = await feesService.getFeeStructures(student.batchId);

      return res.status(200).json({
        success: true,
        data: structures,
      });
    } catch (error) {
      log("error", "app.fees.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("FeesController.getFeeStructures error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get fee structures: ${error}`,
      });
    }
  }
}

export const feesController = new FeesController();
