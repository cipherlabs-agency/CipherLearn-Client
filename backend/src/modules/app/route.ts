import { Router } from "express";
import { isStudent, isAppUser } from "../auth/middleware";
import profileRoutes from "./profile/route";
import dashboardRoutes from "./dashboard/route";
import attendanceRoutes from "./attendance/route";
import assignmentsRoutes from "./assignments/route";
import announcementsRoutes from "./announcements/route";
import resourcesRoutes from "./resources/route";
import feesRoutes from "./fees/route";

const router = Router();

// ==================== STUDENT-ONLY ROUTES ====================
// Routes that only students can access

// Profile - student only (their own profile)
router.use("/profile", isStudent, profileRoutes);

// Fees - student only (their own fees)
router.use("/fees", isStudent, feesRoutes);

// ==================== MULTI-ROLE ROUTES ====================
// Routes accessible to students and teachers
// Each route module handles role-specific logic internally

// Dashboard - different views for students vs teachers
router.use("/dashboard", isAppUser, dashboardRoutes);

// Attendance - students can view their attendance
router.use("/attendance", isAppUser, attendanceRoutes);

// Assignments - students submit, teachers review
// Note: assignments route has its own middleware per endpoint
router.use("/assignments", assignmentsRoutes);

// Announcements - all app users can view
router.use("/announcements", isAppUser, announcementsRoutes);

// Resources - all app users can view study materials
router.use("/resources", isAppUser, resourcesRoutes);

export default router;
