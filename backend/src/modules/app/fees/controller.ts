import type { Request, Response } from "express";
import { feesService } from "./service";
import { prisma } from "../../../config/db.config";
import logger from "../../../utils/logger";
import { log } from "../../../utils/logtail";
import { PaymentMode } from "../../../../prisma/generated/prisma/client";

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

  // ==================== TEACHER METHODS ====================

  /**
   * GET /app/fees/teacher/students
   * Teacher: list students in their batches with fee status
   */
  async getTeacherStudents(req: Request, res: Response) {
    try {
      const user = req.user!;
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
      const status = req.query.status as PaymentMode | undefined;
      const students = await feesService.getTeacherStudents(user.id, {
        batchId: batchId && !isNaN(batchId) ? batchId : undefined,
        status: status as any,
      });
      return res.status(200).json({ success: true, data: students });
    } catch (error) {
      log("error", "app.fees.teacher.students failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("FeesController.getTeacherStudents error:", error);
      return res.status(500).json({ success: false, message: `Failed to get students: ${error}` });
    }
  }

  /**
   * GET /app/fees/teacher/students/:studentId
   * Teacher: get full fee detail for a student
   */
  async getStudentFeeDetail(req: Request, res: Response) {
    try {
      const user = req.user!;
      const studentId = Number(req.params.studentId);
      if (isNaN(studentId)) return res.status(400).json({ success: false, message: "Invalid student ID" });

      const detail = await feesService.getStudentFeeDetail(studentId, user.id);
      return res.status(200).json({ success: true, data: detail });
    } catch (error: any) {
      log("error", "app.fees.teacher.student-detail failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("FeesController.getStudentFeeDetail error:", error);
      if (error.message?.includes("not found") || error.message?.includes("do not teach")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: `Failed to get student fee detail: ${error}` });
    }
  }

  /**
   * POST /app/fees/teacher/receipts/:receiptId/payment
   * Teacher: record a payment for a fee receipt
   * Body: { paidAmount, paymentMode, transactionId?, chequeNumber?, notes? }
   */
  async recordPayment(req: Request, res: Response) {
    try {
      const user = req.user!;
      const receiptId = Number(req.params.receiptId);
      if (isNaN(receiptId)) return res.status(400).json({ success: false, message: "Invalid receipt ID" });

      const { paidAmount, paymentMode, transactionId, chequeNumber, notes } = req.body;
      if (!paidAmount || paidAmount <= 0) return res.status(400).json({ success: false, message: "paidAmount must be a positive number" });
      if (!paymentMode || !Object.values(PaymentMode).includes(paymentMode)) {
        return res.status(400).json({ success: false, message: `paymentMode must be one of: ${Object.values(PaymentMode).join(", ")}` });
      }

      const receipt = await feesService.recordPayment(receiptId, user.id, {
        paidAmount: Number(paidAmount),
        paymentMode: paymentMode as PaymentMode,
        transactionId,
        chequeNumber,
        notes,
        teacherName: user.name,
      });

      return res.status(200).json({ success: true, message: "Payment recorded", data: receipt });
    } catch (error: any) {
      log("error", "app.fees.teacher.payment failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("FeesController.recordPayment error:", error);
      if (error.message?.includes("not found") || error.message?.includes("not have access")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: `Failed to record payment: ${error}` });
    }
  }

  /**
   * GET /app/fees/receipts/:id/pdf
   * Student: generate and download a PDF for a fee receipt
   */
  async getReceiptPdf(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({ success: false, message: "Student not authenticated" });
      }
      const receiptId = Number(req.params.id);
      if (isNaN(receiptId)) return res.status(400).json({ success: false, message: "Invalid receipt ID" });

      const result = await feesService.generateReceiptPdf(receiptId, student.id);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "app.fees.receipt.pdf failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("FeesController.getReceiptPdf error:", error);
      if (error.message?.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: `Failed to generate PDF: ${error}` });
    }
  }

  /**
   * POST /app/fees/teacher/students/:studentId/reminder
   * Teacher: send a push notification fee reminder to a student
   */
  async sendFeeReminder(req: Request, res: Response) {
    try {
      const studentId = Number(req.params.studentId);
      if (isNaN(studentId)) return res.status(400).json({ success: false, message: "Invalid student ID" });

      const student = await (prisma as any).student.findFirst({
        where: { id: studentId, isDeleted: false },
        select: { userId: true, fullname: true },
      });
      if (!student) return res.status(404).json({ success: false, message: "Student not found" });

      if (student.userId) {
        import("../../../utils/pushNotifications").then(({ sendToUser }) => {
          sendToUser(student.userId, "Fee Payment Reminder", "You have a pending fee payment. Please pay at the earliest.").catch(() => {});
        });
      }

      return res.status(200).json({ success: true, message: "Reminder sent" });
    } catch (error) {
      log("error", "app.fees.teacher.reminder failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("FeesController.sendFeeReminder error:", error);
      return res.status(500).json({ success: false, message: `Failed to send reminder: ${error}` });
    }
  }
}

export const feesController = new FeesController();
