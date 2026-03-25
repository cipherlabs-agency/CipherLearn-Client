import { Router, Request, Response } from "express";
import { isStudent, isAppUser, isTeacher, isAdminOrTeacher } from "../auth/middleware";
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
import doubtsRoutes from "./doubts/route";
import { profileController } from "./profile/controller";
import { settingsService } from "../dashboard/settings/service";
import { config } from "../../config/env.config";
import { appReadRateLimiter } from "../../middleware/rateLimiter";
import { dashboardController } from "./dashboard/controller";
import { log } from "../../utils/logtail";

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
    log("error", "app.json failed", { err: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : "Failed to fetch settings";
    res.status(500).json({ success: false, message });
  }
});

// App Onboarding QR — admin/teacher generates QR for new student/teacher onboarding
// React Native app scans → stores api URL → calls GET /api/app/settings for full config
router.get("/onboarding-qr", isAdminOrTeacher, async (req: Request, res: Response) => {
  try {
    const QRCode = await import("qrcode");
    const protocol = (req.get("x-forwarded-proto") as string | undefined) ?? req.protocol;
    const apiUrl = config.APP.URL || `${protocol}://${req.get("host") ?? "localhost"}`;

    const payload = {
      v: 1,
      api: apiUrl,
      name: config.CLASS.NAME,
      primary: config.CLASS.PRIMARY_COLOR,
      accent: config.CLASS.ACCENT_COLOR,
      ...(config.CLASS.LOGO_URL ? { logo: config.CLASS.LOGO_URL } : {}),
    };

    const qrDataUrl: string = await QRCode.toDataURL(JSON.stringify(payload), {
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    res.json({ success: true, data: { payload, qrDataUrl } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate QR code";
    res.status(500).json({ success: false, message });
  }
});

// ==================== STUDENT-ONLY ROUTES ====================
// Routes that only students can access

// My teacher info (for Ask Doubts screen) - student only
router.get(
  "/teachers/my-teacher",
  isStudent,
  appReadRateLimiter,
  profileController.getMyTeacher.bind(profileController)
);

// Profile - student and teacher (each handles own auth within the route)
router.use("/profile", profileRoutes);

// Fees - role-specific auth handled within the route module (student own fees + teacher management)
router.use("/fees", feesRoutes);

// ==================== MULTI-ROLE ROUTES ====================
// Routes accessible to students and teachers
// Each route module handles role-specific logic internally

// Dashboard - student-only (current implementation relies on req.student)
router.use("/dashboard", isStudent, dashboardRoutes);

// Teacher dashboard overview
router.get(
  "/teacher/dashboard",
  isTeacher,
  appReadRateLimiter,
  dashboardController.getTeacherDashboard.bind(dashboardController)
);

// Attendance - role-specific auth handled within the route module
router.use("/attendance", attendanceRoutes);

// Assignments - students submit, teachers review
// Note: assignments route has its own middleware per endpoint
router.use("/assignments", assignmentsRoutes);

// Announcements - all app users can view
router.use("/announcements", isAppUser, announcementsRoutes);

// Notifications — preferences (student only, checked per-endpoint) + device token (all app users)
router.use("/notifications", isAppUser, notificationsRoutes);

// Resources - role-specific auth handled within the route module
router.use("/resources", resourcesRoutes);

// Lectures - schedule for students and teachers
router.use("/lectures", isAppUser, appLecturesRoutes);

// Tests - student scores and teacher batch views
router.use("/tests", appTestsRoutes);

// Doubts - student ask, teacher reply
router.use("/doubts", doubtsRoutes);

export default router;
