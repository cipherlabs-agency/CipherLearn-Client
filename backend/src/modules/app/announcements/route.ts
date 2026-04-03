import { Router } from "express";
import { announcementsController } from "./controller";
import { appReadRateLimiter, appWriteRateLimiter, fileUploadRateLimiter } from "../../../middleware/rateLimiter";
import { isAdmin } from "../../auth/middleware";
import { notesUpload } from "../../../config/multer.config";
import { validate } from "../../../middleware/validate";
import { AnnouncementsValidations } from "./validation";

const router = Router();

// ==================== ADMIN-ONLY ROUTES (before /:id) ====================

/**
 * POST /app/announcements/teacher
 * Admin: create announcement (multipart: title, description, body, category, department?, pinned?, files[])
 */
router.post(
  "/teacher",
  isAdmin,
  fileUploadRateLimiter,
  notesUpload.array("files", 5),
  validate(AnnouncementsValidations.createAnnouncement),
  announcementsController.createAnnouncement.bind(announcementsController)
);

/**
 * PUT /app/announcements/teacher/:id/pin
 * Admin: toggle pinned status (must come before /:id)
 */
router.put(
  "/teacher/:id/pin",
  isAdmin,
  announcementsController.togglePin.bind(announcementsController)
);

/**
 * PUT /app/announcements/teacher/:id
 * Admin: update an announcement
 */
router.put(
  "/teacher/:id",
  isAdmin,
  appWriteRateLimiter,
  validate(AnnouncementsValidations.updateAnnouncement),
  announcementsController.updateAnnouncement.bind(announcementsController)
);

/**
 * DELETE /app/announcements/teacher/:id
 * Admin: soft-delete an announcement
 */
router.delete(
  "/teacher/:id",
  isAdmin,
  announcementsController.deleteAnnouncement.bind(announcementsController)
);

// ==================== SHARED ROUTES ====================
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
  validate(AnnouncementsValidations.listQuery, "query"),
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
