import { Router } from "express";
import { attendanceController } from "./controller";

const router = Router();

// Get student's own attendance records
router.get("/", attendanceController.getAttendance.bind(attendanceController));

// Get attendance history with filters
router.get("/history", attendanceController.getHistory.bind(attendanceController));

// Get attendance calendar for a month
router.get("/calendar", attendanceController.getCalendar.bind(attendanceController));

// =====================
// QR CODE ATTENDANCE - TEMPORARILY DISABLED
// =====================
// QR attendance feature is currently disabled.
// Manual attendance marking by teachers/admins is the only supported method.
//
// router.post("/mark-qr", attendanceController.markQRAttendance.bind(attendanceController));

export default router;
