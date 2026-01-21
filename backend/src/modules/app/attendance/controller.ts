import type { Request, Response } from "express";
import { attendanceService } from "./service";
import logger from "../../../utils/logger";

class AttendanceController {
  /**
   * Get attendance performance
   * GET /app/attendance
   */
  async getAttendance(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const attendance = await attendanceService.getAttendancePerformance(
        student.id,
        student.batchId
      );

      return res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      logger.error("AttendanceController.getAttendance error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get attendance: ${error}`,
      });
    }
  }

  /**
   * Mark attendance via QR code
   * POST /app/attendance/mark-qr
   */
  async markQRAttendance(req: Request, res: Response) {
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

      const { qrData } = req.body;
      if (!qrData) {
        return res.status(400).json({
          success: false,
          message: "QR data is required",
        });
      }

      const result = await attendanceService.markQRAttendance(
        student.id,
        student.batchId,
        qrData
      );

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("AttendanceController.markQRAttendance error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to mark attendance: ${error}`,
      });
    }
  }
}

export const attendanceController = new AttendanceController();
