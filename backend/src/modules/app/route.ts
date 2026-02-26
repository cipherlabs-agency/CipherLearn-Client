import { Router, Request, Response } from "express";
import { isStudent, isAppUser } from "../auth/middleware";
import profileRoutes from "./profile/route";
import dashboardRoutes from "./dashboard/route";
import attendanceRoutes from "./attendance/route";
import assignmentsRoutes from "./assignments/route";
import announcementsRoutes from "./announcements/route";
import notificationsRoutes from "./notifications/route";
import resourcesRoutes from "./resources/route";
import feesRoutes from "./fees/route";
import appLecturesRoutes from "./lectures/route";
import appTestsRoutes from "./tests/route";
import { settingsService } from "../dashboard/settings/service";
import { config } from "../../config/env.config";

const router = Router();

// Public settings — app uses this to get branding + feature flags + teacher permissions
// No auth required: needed before login to style the app UI
router.get("/settings", async (_req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings();
    res.json({
      success: true,
      data: {
        class: {
          name: settings.className,
          email: settings.classEmail,
          phone: settings.classPhone,
          address: settings.classAddress,
          website: settings.classWebsite,
        },
        branding: {
          primaryColor: config.CLASS.PRIMARY_COLOR,
          accentColor: config.CLASS.ACCENT_COLOR,
          logoUrl: config.CLASS.LOGO_URL,
        },
        features: {
          qrAttendance: config.FEATURES.QR_ATTENDANCE,
          fees: config.FEATURES.FEES,
          assignments: config.FEATURES.ASSIGNMENTS,
          studyMaterials: config.FEATURES.STUDY_MATERIALS,
          announcements: config.FEATURES.ANNOUNCEMENTS,
          videos: config.FEATURES.VIDEOS,
        },
        teacherPermissions: settings.teacherPermissions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch settings";
    res.status(500).json({ success: false, message });
  }
});

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

// Attendance - role-specific auth handled within the route module
router.use("/attendance", attendanceRoutes);

// Assignments - students submit, teachers review
// Note: assignments route has its own middleware per endpoint
router.use("/assignments", assignmentsRoutes);

// Announcements - all app users can view
router.use("/announcements", isAppUser, announcementsRoutes);

// Notifications preferences - student only
router.use("/notifications", isStudent, notificationsRoutes);

// Resources - role-specific auth handled within the route module
router.use("/resources", resourcesRoutes);

// Lectures - schedule for students and teachers
router.use("/lectures", isAppUser, appLecturesRoutes);

// Tests - student scores and teacher batch views
router.use("/tests", appTestsRoutes);

export default router;
