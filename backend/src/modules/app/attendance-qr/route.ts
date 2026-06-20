import { Router } from "express";
import { isTeacher } from "../../auth/middleware";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import { appAttendanceQrController } from "./controller";

/**
 * Additional teacher QR-attendance routes, mounted ALSO at /api/app/attendance
 * (alongside the existing attendance module). Paths do not collide.
 * Register in app/route.ts AFTER the existing attendance mount:
 *   router.use("/attendance", attendanceQrRoutes);
 *
 * Gated behind features.qrAttendance at the app layer; pairs with re-enabling
 * the student POST /attendance/mark-qr route (INTEGRATION.md, C9).
 */
const router = Router();

router.post(
  "/teacher/qr-token",
  isTeacher,
  appWriteRateLimiter,
  appAttendanceQrController.generate.bind(appAttendanceQrController)
);

router.get(
  "/teacher/qr-status/:batchId",
  isTeacher,
  appReadRateLimiter,
  appAttendanceQrController.status.bind(appAttendanceQrController)
);

export default router;
