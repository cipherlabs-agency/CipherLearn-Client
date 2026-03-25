import type { Request, Response } from "express";
import { Prisma } from "../../../../prisma/generated/prisma/client";
import AttendanceService from "./service";
import {
  MarkBulkAttendanceInput,
  AttendanceReportQuery,
  QRAttendanceInput,
} from "./types";
import { log } from "../../../utils/logtail";

const attendanceService = new AttendanceService();

export default class AttendanceController {
  /**
   * Create a new attendance sheet
   */
  async createAttendanceSheet(req: Request, res: Response) {
    try {
      const data: Prisma.AttendanceSheetCreateInput = req.body;
      const attendanceSheet =
        await attendanceService.createAttendanceSheet(data);

      return res.status(201).json({
        success: true,
        message: "Attendance sheet created successfully",
        data: attendanceSheet,
      });
    } catch (error) {
      log("error", "dashboard.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Mark manual attendance for a single student
   */
  async markManualAttendance(req: Request, res: Response) {
    try {
      const data: Prisma.AttendanceCreateInput = req.body;
      const attendance = await attendanceService.markManualAttendance(data);
      return res.status(201).json({
        success: true,
        message: "Attendance marked successfully",
        data: attendance,
      });
    } catch (error) {
      log("error", "dashboard.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Mark bulk attendance for multiple students
   */
  async markBulkAttendance(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { batchId, date, attendances } = req.body;

      const input: MarkBulkAttendanceInput = {
        batchId: Number(batchId),
        date,
        markedBy: user.name,
        markedById: user.id,
        attendances,
      };

      const result = await attendanceService.markBulkAttendance(input);

      return res.status(200).json({
        success: true,
        message: `Attendance marked: ${result.successful} successful, ${result.failed} failed`,
        data: result,
      });
    } catch (error: any) {
      log("error", "dashboard.attendance.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to mark bulk attendance",
      });
    }
  }

  /**
   * Update a single attendance record
   */
  async updateAttendance(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const attendanceId = Number(req.params.id);
      const { status } = req.body;

      const updated = await attendanceService.updateAttendance(attendanceId, {
        status,
        markedBy: user.name,
        markedById: user.id,
      });

      return res.status(200).json({
        success: true,
        message: "Attendance updated successfully",
        data: updated,
      });
    } catch (error: any) {
      log("error", "dashboard.attendance.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      if (error.message === "Attendance record not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Get attendance sheet for a batch
   */
  async getBatchAttendanceSheet(req: Request, res: Response) {
    try {
      const batchId = Number(req.params.batchId);
      const attendanceSheets =
        await attendanceService.getBatchAttendanceSheet(batchId);
      return res.status(200).json({
        success: true,
        message: "Attendance sheets fetched successfully",
        data: attendanceSheets,
      });
    } catch (error: any) {
      log("error", "dashboard.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message === "Batch not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Get batch attendance for a specific date
   */
  async getBatchAttendanceByDate(req: Request, res: Response) {
    try {
      const batchId = Number(req.params.batchId);
      const date = req.query.date as string;

      if (!date) {
        return res
          .status(400)
          .json({ success: false, message: "Date is required" });
      }

      const attendances = await attendanceService.getBatchAttendanceByDate(
        batchId,
        date
      );

      return res.status(200).json({
        success: true,
        data: attendances,
      });
    } catch (error: any) {
      log("error", "dashboard.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message === "Batch not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Get student attendance matrix for calendar view
   */
  async getStudentAttendanceMatrix(req: Request, res: Response) {
    try {
      const studentId = Number(req.params.studentId);
      if (!studentId || Number.isNaN(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId" });
      }

      const monthQ = req.query.month as string | undefined;
      const yearQ = req.query.year as string | undefined;

      const month = monthQ ? Number(monthQ) : undefined;
      const year = yearQ ? Number(yearQ) : undefined;

      const result = await attendanceService.getStudentAttendanceMatrix(
        studentId,
        { month, year }
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      log("error", "dashboard.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      console.error("getStudentAttendanceHandler error:", error);
      return res
        .status(500)
        .json({ success: false, message: String(error.message ?? error) });
    }
  }

  /**
   * Generate attendance report for a batch
   */
  async generateReport(req: Request, res: Response) {
    try {
      const batchId = Number(req.params.batchId);
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const query: AttendanceReportQuery = {
        batchId,
        startDate: startDate as string,
        endDate: endDate as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Math.min(Number(req.query.limit), 200) : 50,
      };

      const report = await attendanceService.generateAttendanceReport(query);

      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      log("error", "dashboard.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message === "Batch not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate report",
      });
    }
  }

  // =====================
  // QR CODE ATTENDANCE
  // =====================

  /**
   * Generate QR code for a batch (Admin/Teacher)
   */
  async generateQRCode(req: Request, res: Response) {
    try {
      const batchId = Number(req.params.batchId);

      if (!batchId || Number.isNaN(batchId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid batchId" });
      }

      const qrData = await attendanceService.generateBatchQRCode(batchId);

      return res.status(200).json({
        success: true,
        message: "QR code generated successfully",
        data: qrData,
      });
    } catch (error: any) {
      log("error", "dashboard.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
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
   * Mark attendance via QR code (Student)
   */
  async markQRAttendance(req: Request, res: Response) {
    try {
      const { studentId, qrData }: QRAttendanceInput = req.body;

      if (!studentId || !qrData) {
        return res.status(400).json({
          success: false,
          message: "studentId and qrData are required",
        });
      }

      const result = await attendanceService.markQRAttendance(studentId, qrData);

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
      log("error", "dashboard.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to mark QR attendance",
      });
    }
  }

  /**
   * Get student's attendance history
   */
  async getStudentHistory(req: Request, res: Response) {
    try {
      const studentId = Number(req.params.studentId);
      const limit = Number(req.query.limit) || 30;

      if (!studentId || Number.isNaN(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId" });
      }

      const history = await attendanceService.getStudentAttendanceHistory(
        studentId,
        limit
      );

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      log("error", "dashboard.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch attendance history",
      });
    }
  }
}
