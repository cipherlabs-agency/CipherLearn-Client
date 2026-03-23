import { Router } from "express";
import { announcementsController } from "./controller";
import { appReadRateLimiter, appWriteRateLimiter, fileUploadRateLimiter } from "../../../middleware/rateLimiter";
import { isTeacher, requireTeacherPermission } from "../../auth/middleware";
import { notesUpload } from "../../../config/multer.config";
import { validate } from "../../../middleware/validate";
import { AnnouncementsValidations } from "./validation";

const router = Router();

// ==================== TEACHER ROUTES (before /:id) ====================

/**
 * POST /app/announcements/teacher
 * Teacher: create announcement (multipart: title, description, body, category, department?, pinned?, files[])
 */
router.post(
  "/teacher",
  isTeacher, requireTeacherPermission('canSendAnnouncements'),
  fileUploadRateLimiter,
  notesUpload.array("files", 5),
  validate(AnnouncementsValidations.createAnnouncement),
  announcementsController.createAnnouncement.bind(announcementsController)
);

/**
 * PUT /app/announcements/teacher/:id/pin
 * Teacher: toggle pinned status (must come before /:id)
 */
router.put(
  "/teacher/:id/pin",
  isTeacher, requireTeacherPermission('canSendAnnouncements'),
  announcementsController.togglePin.bind(announcementsController)
);

/**
 * PUT /app/announcements/teacher/:id
 * Teacher: update their own announcement
 */
router.put(
  "/teacher/:id",
  isTeacher, requireTeacherPermission('canSendAnnouncements'),
  appWriteRateLimiter,
  validate(AnnouncementsValidations.updateAnnouncement),
  announcementsController.updateAnnouncement.bind(announcementsController)
);

/**
 * DELETE /app/announcements/teacher/:id
 * Teacher: soft-delete their own announcement
 */
router.delete(
  "/teacher/:id",
  isTeacher, requireTeacherPermission('canSendAnnouncements'),
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
