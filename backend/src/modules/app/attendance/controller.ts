import type { Request, Response } from "express";
import { attendanceService } from "./service";
import logger from "../../../utils/logger";
import type { AttendanceHistoryQuery, MarkAttendanceInput } from "./types";
import { log } from "../../../utils/logtail";

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
      log("error", "app.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AttendanceController.getAttendance error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get attendance: ${error}`,
      });
    }
  }

  /**
   * Get attendance history with filters
   * GET /app/attendance/history
   */
  async getHistory(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const query: AttendanceHistoryQuery = {
        month: req.query.month ? Number(req.query.month) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        status: req.query.status as AttendanceHistoryQuery["status"],
        subject: req.query.subject as string | undefined,
      };

      const history = await attendanceService.getHistory(
        student.id,
        student.batchId,
        query
      );

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      log("error", "app.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AttendanceController.getHistory error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get attendance history: ${error}`,
      });
    }
  }

  /**
   * Get attendance calendar for a month
   * GET /app/attendance/calendar
   */
  async getCalendar(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const month = Number(req.query.month);
      const year = Number(req.query.year);

      const calendar = await attendanceService.getCalendar(
        student.id,
        student.batchId,
        month,
        year
      );

      return res.status(200).json({
        success: true,
        data: calendar,
      });
    } catch (error) {
      log("error", "app.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AttendanceController.getCalendar error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get attendance calendar: ${error}`,
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
      log("error", "app.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AttendanceController.markQRAttendance error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to mark attendance: ${error}`,
      });
    }
  }

  // ==================== TEACHER ENDPOINTS ====================

  /**
   * Get all batches (for attendance Select Class/Batch dropdowns)
   * GET /app/attendance/teacher/batches
   */
  async getBatches(req: Request, res: Response) {
    try {
      const batches = await attendanceService.getBatches();
      return res.status(200).json({ success: true, data: batches });
    } catch (error) {
      log("error", "app.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AttendanceController.getBatches error:", error);
      return res.status(500).json({ success: false, message: "Failed to get batches" });
    }
  }

  /**
   * Get students in a batch (for attendance marking screen)
   * GET /app/attendance/teacher/students?batchId=
   */
  async getBatchStudents(req: Request, res: Response) {
    try {
      const batchId = Number(req.query.batchId);
      if (isNaN(batchId) || batchId <= 0) {
        return res.status(400).json({ success: false, message: "Valid batchId is required" });
      }

      const students = await attendanceService.getBatchStudents(batchId);
      return res.status(200).json({ success: true, data: students });
    } catch (error) {
      log("error", "app.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AttendanceController.getBatchStudents error:", error);
      return res.status(500).json({ success: false, message: "Failed to get students" });
    }
  }

  /**
   * Bulk mark attendance for a date
   * POST /app/attendance/teacher/mark
   * Body: { batchId, date (YYYY-MM-DD), records: [{ studentId, status, reason? }] }
   */
  async markTeacherAttendance(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const input = req.body as MarkAttendanceInput;

      if (!input.batchId || !input.date || !Array.isArray(input.records)) {
        return res.status(400).json({
          success: false,
          message: "batchId, date, and records array are required",
        });
      }

      const validStatuses = ["PRESENT", "ABSENT", "LATE"];
      for (const record of input.records) {
        if (!record.studentId || !validStatuses.includes(record.status)) {
          return res.status(400).json({
            success: false,
            message: `Invalid record: studentId and status (PRESENT|ABSENT|LATE) required`,
          });
        }
      }

      const result = await attendanceService.markTeacherAttendance(
        user.id,
        user.name,
        input
      );

      return res.status(200).json({
        success: true,
        message: `Attendance marked for ${result.marked} students`,
        data: result,
      });
    } catch (error) {
      log("error", "app.attendance.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AttendanceController.markTeacherAttendance error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to mark attendance";
      return res.status(400).json({ success: false, message });
    }
  }

  /**
   * Get attendance reports for a batch (past dates with audit info)
   * GET /app/attendance/teacher/reports?batchId=&page=&limit=
   */
  async getTeacherReports(req: Request, res: Response) {
    try {
      const batchId = Number(req.query.batchId);
      if (isNaN(batchId) || batchId <= 0) {
        return res.status(400).json({ success: false, message: "Valid batchId is required" });
      }

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = Math.min(req.query.limit ? Number(req.query.limit) : 20, 50);

      const result = await attendanceService.getTeacherReports(batchId, page, limit);

      return res.status(200).json({
        success: true,
        data: result.reports,
        pagination: result.pagination,
      });
    } catch (error) {
      log("error", "app.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AttendanceController.getTeacherReports error:", error);
      return res.status(500).json({ success: false, message: "Failed to get reports" });
    }
  }

  /**
   * Get detailed attendance for a specific date (expandable card)
   * GET /app/attendance/teacher/detail?batchId=&date=YYYY-MM-DD
   */
  async getDateDetail(req: Request, res: Response) {
    try {
      const batchId = Number(req.query.batchId);
      const date = req.query.date as string;

      if (isNaN(batchId) || batchId <= 0 || !date) {
        return res.status(400).json({
          success: false,
          message: "Valid batchId and date (YYYY-MM-DD) are required",
        });
      }

      const records = await attendanceService.getDateAttendanceDetail(batchId, date);

      return res.status(200).json({ success: true, data: records });
    } catch (error) {
      log("error", "app.attendance.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AttendanceController.getDateDetail error:", error);
      return res.status(500).json({ success: false, message: "Failed to get attendance detail" });
    }
  }
}

export const attendanceController = new AttendanceController();
