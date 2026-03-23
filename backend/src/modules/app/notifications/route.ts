import { Router } from "express";
import { notificationsController } from "./controller";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import { validate } from "../../../middleware/validate";
import { NotificationsValidations } from "./validation";

const router = Router();

// Auth enforced at parent level (isAppUser applied in app/route.ts)
// Preference endpoints do an additional isStudent check via req.student

/**
 * GET /app/notifications
 * List in-app notifications for the current user (students & teachers)
 *   ?page=&limit=&unreadOnly=true
 */
router.get(
  "/",
  appReadRateLimiter,
  validate(NotificationsValidations.listQuery, "query"),
  notificationsController.getNotifications.bind(notificationsController)
);

/**
 * PUT /app/notifications/read-all
 * Mark all notifications as read
 * Must be BEFORE /:id/read to avoid route conflict
 */
router.put(
  "/read-all",
  notificationsController.markAllRead.bind(notificationsController)
);

/**
 * PUT /app/notifications/:id/read
 * Mark a single notification as read
 */
router.put(
  "/:id/read",
  notificationsController.markNotificationRead.bind(notificationsController)
);

/**
 * GET /app/notifications/preferences
 * Returns student's notification preferences.
 * Returns defaults if no preferences saved yet.
 *
 * Rate limit: 120 req/min per IP
 * Cache: 10 min per student
 */
router.get(
  "/preferences",
  appReadRateLimiter,
  notificationsController.getPreferences.bind(notificationsController)
);

/**
 * PUT /app/notifications/preferences
 * Save (upsert) notification preferences. Partial updates supported.
 * Student only — teachers have no preference record.
 *
 * Body (JSON): {
 *   academicAlerts?: { classStartingSoon?: boolean, timetableChanges?: boolean },
 *   examsResults?: { newTestScheduled?: boolean, resultPublished?: boolean },
 *   materialsUpdates?: { newStudyMaterial?: boolean, classResourceUploaded?: boolean },
 *   administrative?: { schoolAnnouncements?: boolean, doubtResponses?: boolean },
 *   quietHours?: { enabled?: boolean, from?: "HH:MM", to?: "HH:MM" }
 * }
 *
 * Rate limit: 120 req/min per IP
 */
router.put(
  "/preferences",
  appWriteRateLimiter,
  validate(NotificationsValidations.updatePreferences),
  notificationsController.updatePreferences.bind(notificationsController)
);

/**
 * POST /app/notifications/register-device
 * Register a device push token. Works for students and teachers.
 * Call this after login (or when the OS grants push permission).
 *
 * Body: { token: string, platform?: "EXPO" | "IOS" | "ANDROID" }
 */
router.post(
  "/register-device",
  appWriteRateLimiter,
  validate(NotificationsValidations.registerDevice),
  notificationsController.registerDevice.bind(notificationsController)
);

/**
 * DELETE /app/notifications/register-device
 * Remove a device push token. Call on logout.
 *
 * Body: { token: string }
 */
router.delete(
  "/register-device",
  appWriteRateLimiter,
  validate(NotificationsValidations.deregisterDevice),
  notificationsController.deregisterDevice.bind(notificationsController)
);

export default router;
