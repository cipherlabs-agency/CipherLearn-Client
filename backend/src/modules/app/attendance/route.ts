import { Router } from "express";
import { attendanceController } from "./controller";
import { isStudent, isTeacher } from "../../auth/middleware";
import { appReadRateLimiter } from "../../../middleware/rateLimiter";

const router = Router();

// ==================== TEACHER ROUTES ====================

/**
 * GET /app/attendance/teacher/batches
 * Teacher: list all active batches for Select Class/Batch dropdowns
 */
router.get(
  "/teacher/batches",
  isTeacher,
  appReadRateLimiter,
  attendanceController.getBatches.bind(attendanceController)
);

/**
 * GET /app/attendance/teacher/students?batchId=
 * Teacher: get students in a batch for attendance marking
 */
router.get(
  "/teacher/students",
  isTeacher,
  appReadRateLimiter,
  attendanceController.getBatchStudents.bind(attendanceController)
);

/**
 * POST /app/attendance/teacher/mark
 * Teacher: bulk mark attendance for a date
 * Body: { batchId, date, records: [{ studentId, status, reason? }] }
 */
router.post(
  "/teacher/mark",
  isTeacher,
  attendanceController.markTeacherAttendance.bind(attendanceController)
);

/**
 * GET /app/attendance/teacher/reports?batchId=&page=&limit=
 * Teacher: past attendance records by date with audit trail
 */
router.get(
  "/teacher/reports",
  isTeacher,
  appReadRateLimiter,
  attendanceController.getTeacherReports.bind(attendanceController)
);

/**
 * GET /app/attendance/teacher/detail?batchId=&date=YYYY-MM-DD
 * Teacher: per-student detail for a specific date (expandable card)
 */
router.get(
  "/teacher/detail",
  isTeacher,
  appReadRateLimiter,
  attendanceController.getDateDetail.bind(attendanceController)
);

// ==================== STUDENT ROUTES ====================

// Auth: isAppUser is applied at parent level (app/route.ts) for student routes
// Individual student routes enforce isStudent via parent middleware

/**
 * GET /app/attendance
 * Student: their own attendance performance & summary
 */
router.get(
  "/",
  isStudent,
  attendanceController.getAttendance.bind(attendanceController)
);

/**
 * GET /app/attendance/history
 * Student: paginated attendance history with filters
 */
router.get(
  "/history",
  isStudent,
  attendanceController.getHistory.bind(attendanceController)
);

/**
 * GET /app/attendance/calendar?month=&year=
 * Student: per-day attendance calendar for a given month
 */
router.get(
  "/calendar",
  isStudent,
  attendanceController.getCalendar.bind(attendanceController)
);

// =====================
// QR CODE ATTENDANCE (C9 — re-enabled; teacher generates token via /app/attendance/teacher/qr-token)
// Requires QR_SECRET env, qRAttendanceToken table, and config.FEATURES.QR_ATTENDANCE=true
// =====================
router.post("/mark-qr", isStudent, attendanceController.markQRAttendance.bind(attendanceController));

export default router;
