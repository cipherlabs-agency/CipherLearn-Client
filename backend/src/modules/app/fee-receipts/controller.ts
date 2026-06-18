import { Request, Response } from "express";
import FeesService from "../../dashboard/fees/service";
import { logger } from "../../../utils/logger";

/**
 * App fee-receipts controller — exposes the dashboard FeesService receipt
 * management (create / bulk / update / delete / summary) under
 * /api/app/fees/* for teacher & admin. The existing app/fees module keeps
 * student receipts + teacher "record payment"; this adds receipt generation.
 */
const feesService = new FeesService();

export class AppFeeReceiptsController {
  // POST /app/fees/teacher/receipts
  async createReceipt(req: Request, res: Response) {
    try {
      const b = req.body || {};
      if (b.studentId == null || b.batchId == null || b.totalAmount == null || b.academicMonth == null || b.academicYear == null || !b.dueDate) {
        return res.status(400).json({ success: false, message: "studentId, batchId, totalAmount, academicMonth, academicYear and dueDate are required" });
      }
      const receipt = await feesService.createReceipt({
        studentId: Number(b.studentId),
        batchId: Number(b.batchId),
        feeStructureId: b.feeStructureId != null ? Number(b.feeStructureId) : undefined,
        totalAmount: Number(b.totalAmount),
        paidAmount: b.paidAmount != null ? Number(b.paidAmount) : undefined,
        discountAmount: b.discountAmount != null ? Number(b.discountAmount) : undefined,
        lateFeeAmount: b.lateFeeAmount != null ? Number(b.lateFeeAmount) : undefined,
        paymentMode: b.paymentMode,
        transactionId: b.transactionId,
        chequeNumber: b.chequeNumber,
        bankName: b.bankName,
        paymentNotes: b.paymentNotes,
        academicMonth: Number(b.academicMonth),
        academicYear: Number(b.academicYear),
        dueDate: new Date(b.dueDate),
        paymentDate: b.paymentDate ? new Date(b.paymentDate) : undefined,
        generatedBy: req.user?.name || "App User",
        generatedById: req.user?.id,
      });
      return res.status(201).json({ success: true, data: receipt });
    } catch (error) {
      logger.error("AppFeeReceipts.createReceipt error:", error);
      const msg = error instanceof Error ? error.message : "Failed to create receipt";
      return res.status(msg.includes("not found") ? 404 : 500).json({ success: false, message: msg });
    }
  }

  // POST /app/fees/teacher/receipts/bulk  (admin)
  async bulkCreateReceipts(req: Request, res: Response) {
    try {
      const b = req.body || {};
      if (b.batchId == null || b.academicMonth == null || b.academicYear == null || !b.dueDate) {
        return res.status(400).json({ success: false, message: "batchId, academicMonth, academicYear and dueDate are required" });
      }
      const result = await feesService.bulkCreateReceipts({
        batchId: Number(b.batchId),
        feeStructureId: b.feeStructureId != null ? Number(b.feeStructureId) : undefined,
        academicMonth: Number(b.academicMonth),
        academicYear: Number(b.academicYear),
        dueDate: new Date(b.dueDate),
        studentIds: Array.isArray(b.studentIds) ? b.studentIds.map(Number) : undefined,
        generatedBy: req.user?.name || "App Admin",
        generatedById: req.user?.id,
      });
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error("AppFeeReceipts.bulkCreateReceipts error:", error);
      const msg = error instanceof Error ? error.message : "Failed to bulk create receipts";
      return res.status(msg.includes("not found") ? 404 : 500).json({ success: false, message: msg });
    }
  }

  // PUT /app/fees/teacher/receipts/:id
  async updateReceipt(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const receipt = await feesService.updateReceipt(id, req.body || {});
      return res.status(200).json({ success: true, data: receipt });
    } catch (error) {
      logger.error("AppFeeReceipts.updateReceipt error:", error);
      const msg = error instanceof Error ? error.message : "Failed to update receipt";
      return res.status(msg.includes("not found") ? 404 : 500).json({ success: false, message: msg });
    }
  }

  // DELETE /app/fees/teacher/receipts/:id  (admin)
  async deleteReceipt(req: Request, res: Response) {
    try {
      await feesService.deleteReceipt(Number(req.params.id));
      return res.status(200).json({ success: true, message: "Receipt deleted" });
    } catch (error) {
      logger.error("AppFeeReceipts.deleteReceipt error:", error);
      const msg = error instanceof Error ? error.message : "Failed to delete receipt";
      return res.status(msg.includes("not found") ? 404 : 500).json({ success: false, message: msg });
    }
  }

  // GET /app/fees/teacher/receipts-summary?batchId=&academicMonth=&academicYear=&status=
  async getReceiptsSummary(req: Request, res: Response) {
    try {
      const q = req.query;
      const data = await feesService.getReceiptsSummary({
        batchId: q.batchId ? Number(q.batchId) : undefined,
        studentId: q.studentId ? Number(q.studentId) : undefined,
        status: q.status as any,
        academicMonth: q.academicMonth ? Number(q.academicMonth) : undefined,
        academicYear: q.academicYear ? Number(q.academicYear) : undefined,
        paymentMode: q.paymentMode as any,
      });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppFeeReceipts.getReceiptsSummary error:", error);
      return res.status(500).json({ success: false, message: "Failed to load fees summary" });
    }
  }
}

export const appFeeReceiptsController = new AppFeeReceiptsController();
