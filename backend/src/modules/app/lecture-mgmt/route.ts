import { Router } from "express";
import { isTeacher, isAdmin, requireTeacherPermission } from "../../auth/middleware";
import { appWriteRateLimiter } from "../../../middleware/rateLimiter";
import { appLectureMgmtController } from "./controller";

/**
 * Additional lecture-management routes, mounted ALSO at /api/app/lectures
 * (alongside the existing lectures module). Paths do not collide with the
 * existing /teacher and /teacher/:id routes.
 * Register in app/route.ts AFTER the existing lectures mount:
 *   router.use("/lectures", isAppUser, lectureMgmtRoutes);
 */
const router = Router();

router.post(
  "/teacher/bulk",
  isTeacher,
  requireTeacherPermission("canManageLectures"),
  appWriteRateLimiter,
  appLectureMgmtController.createBulk.bind(appLectureMgmtController)
);

router.put(
  "/teacher/:id/assign",
  isAdmin,
  appWriteRateLimiter,
  appLectureMgmtController.assignTeacher.bind(appLectureMgmtController)
);

export default router;
