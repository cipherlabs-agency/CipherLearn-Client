import { Router } from "express";
import AttendanceController from "./controller";
import { qrAttendanceController } from "./qr.controller";
import { AttendanceValidations } from "./validation";
import { validateRequest } from "../../auth/validations.auth";
import { isAdmin, isAuthenticated, isAdminOrTeacher } from "../../auth/middleware";

const router = Router();
const attendanceController = new AttendanceController();

// All attendance routes require authentication
router.use(isAuthenticated);

// =====================
// ATTENDANCE SHEET ROUTES
// =====================

// Create attendance sheet
router.post(
  "/create-attendance-sheet",
  isAdmin,
  validateRequest(AttendanceValidations.attendanceSheet.create),
  attendanceController.createAttendanceSheet.bind(attendanceController)
);

// =====================
// MANUAL ATTENDANCE ROUTES (Admin/Teacher)
// =====================

// Mark single attendance
router.post(
  "/mark-attendance",
  isAdmin,
  validateRequest(AttendanceValidations.attendance.mark),
  attendanceController.markManualAttendance.bind(attendanceController)
);

// Mark bulk attendance for multiple students
router.post(
  "/mark-bulk",
  isAdmin,
  validateRequest(AttendanceValidations.attendance.markBulk),
  attendanceController.markBulkAttendance.bind(attendanceController)
);

// Update attendance record
router.put(
  "/update/:id",
  isAdmin,
  validateRequest(AttendanceValidations.attendance.update),
  attendanceController.updateAttendance.bind(attendanceController)
);

// =====================
// GET ATTENDANCE DATA
// =====================

// Get batch attendance sheet (all records)
router.get(
  "/batch-attendance-sheet/:batchId",
  attendanceController.getBatchAttendanceSheet.bind(attendanceController)
);

// Get batch attendance for specific date
router.get(
  "/batch/:batchId/date",
  attendanceController.getBatchAttendanceByDate.bind(attendanceController)
);

// Get student attendance matrix (calendar view)
router.get(
  "/student-attendance-matrix/:studentId",
  attendanceController.getStudentAttendanceMatrix.bind(attendanceController)
);

// Get student attendance history
router.get(
  "/student-history/:studentId",
  attendanceController.getStudentHistory.bind(attendanceController)
);

// =====================
// REPORTS
// =====================

// Generate attendance report for a batch
router.get(
  "/report/:batchId",
  isAdmin,
  attendanceController.generateReport.bind(attendanceController)
);

// =====================
// QR CODE ATTENDANCE
// =====================

// Generate QR code for a batch (Admin/Teacher)
// Supports ?regenerate=true query param to force regeneration
router.get(
  "/qr/generate/:batchId",
  isAdminOrTeacher,
  qrAttendanceController.generateQRCode.bind(qrAttendanceController)
);

// Get QR code status for a batch (Admin/Teacher)
router.get(
  "/qr/status/:batchId",
  isAdminOrTeacher,
  qrAttendanceController.getQRCodeStatus.bind(qrAttendanceController)
);

// Mark attendance via QR code (Student)
router.post(
  "/qr/mark",
  validateRequest(AttendanceValidations.qr.mark),
  qrAttendanceController.markQRAttendance.bind(qrAttendanceController)
);

export default router;
