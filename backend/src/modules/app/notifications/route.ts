import { Router } from "express";
import { notificationsController } from "./controller";
import { appReadRateLimiter } from "../../../middleware/rateLimiter";

const router = Router();

// Auth enforced at parent level (isStudent applied in app/route.ts)

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
  appReadRateLimiter,
  notificationsController.updatePreferences.bind(notificationsController)
);

export default router;
