import { Router } from "express";
import { isStudent } from "../auth/middleware";
import profileRoutes from "./profile/route";
import dashboardRoutes from "./dashboard/route";
import attendanceRoutes from "./attendance/route";
import assignmentsRoutes from "./assignments/route";
import announcementsRoutes from "./announcements/route";
import resourcesRoutes from "./resources/route";
import feesRoutes from "./fees/route";

const router = Router();

// All routes require student authentication
router.use(isStudent);

// Sub-module routes
router.use("/profile", profileRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/assignments", assignmentsRoutes);
router.use("/announcements", announcementsRoutes);
router.use("/resources", resourcesRoutes);
router.use("/fees", feesRoutes);

export default router;
