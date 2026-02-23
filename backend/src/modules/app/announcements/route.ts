import { Router } from "express";
import { announcementsController } from "./controller";
import { appReadRateLimiter } from "../../../middleware/rateLimiter";

const router = Router();

// All announcement routes use the read rate limiter
// Auth is enforced at the parent app/route.ts level (isAppUser)

/**
 * GET /app/announcements
 * List active announcements with optional filters:
 *   ?category=EXAM|HOLIDAY|LECTURE|GENERAL|EVENT
 *   ?search=<text>
 *   ?page=1&limit=10
 *
 * Rate limit: 120 req/min per IP
 * Cache: 3 min (invalidated on admin create/update)
 * Security: requires valid app JWT (isAppUser applied at parent router)
 */
router.get(
  "/",
  appReadRateLimiter,
  announcementsController.getAnnouncements.bind(announcementsController)
);

/**
 * GET /app/announcements/:id
 * Full detail: body, attachments, metadata (Important Dates), department
 *
 * Rate limit: 120 req/min per IP
 * Cache: 5 min per id
 */
router.get(
  "/:id",
  appReadRateLimiter,
  announcementsController.getAnnouncementById.bind(announcementsController)
);

export default router;
