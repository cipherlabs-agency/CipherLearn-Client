import type { Request, Response } from "express";
import { qrAttendanceService } from "./qr.service";
import { QRAttendanceInput } from "./types";

/**
 * QR Attendance Controller
 * Handles HTTP requests for QR-based attendance
 */
export class QRAttendanceController {
  /**
   * Generate QR code for a batch (Admin/Teacher)
   * GET /api/dashboard/attendance/qr/generate/:batchId
   */
  async generateQRCode(req: Request, res: Response) {
    try {
      const batchId = Number(req.params.batchId);
      const forceRegenerate = req.query.regenerate === "true";

      if (!batchId || Number.isNaN(batchId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid batchId" });
      }

      const qrData = await qrAttendanceService.generateBatchQRCode(
        batchId,
        forceRegenerate
      );

      return res.status(200).json({
        success: true,
        message: qrData.isExisting
          ? "Existing QR code retrieved successfully"
          : "QR code generated successfully",
        data: qrData,
      });
    } catch (error: any) {
      if (error.message === "Batch not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate QR code",
      });
    }
  }

  /**
   * Get QR code status for a batch
   * GET /api/dashboard/attendance/qr/status/:batchId
   */
  async getQRCodeStatus(req: Request, res: Response) {
    try {
      const batchId = Number(req.params.batchId);

      if (!batchId || Number.isNaN(batchId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid batchId" });
      }

      const status = await qrAttendanceService.getQRCodeStatus(batchId);

      return res.status(200).json({
        success: true,
        message: status.exists
          ? "QR code status retrieved"
          : "No QR code found for today",
        data: status,
      });
    } catch (error: any) {
      if (error.message === "Batch not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get QR code status",
      });
    }
  }

  /**
   * Mark attendance via QR code (Student)
   * POST /api/dashboard/attendance/qr/mark
   * Security: Validates that authenticated user's email matches the student's email
   */
  async markQRAttendance(req: Request, res: Response) {
    try {
      const user = req.user;
      const { studentId, qrData }: QRAttendanceInput = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!studentId || !qrData) {
        return res.status(400).json({
          success: false,
          message: "studentId and qrData are required",
        });
      }

      const result = await qrAttendanceService.markQRAttendance(
        studentId,
        qrData,
        user.email // Pass authenticated user's email for verification
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.attendance,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to mark QR attendance",
      });
    }
  }
}

export const qrAttendanceController = new QRAttendanceController();
