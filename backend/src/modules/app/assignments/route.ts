import { Router } from "express";
import multer from "multer";
import { assignmentsController } from "./controller";
import { isStudent, isAppUser } from "../../auth/middleware";
import { fileUploadRateLimiter, appReadRateLimiter } from "../../../middleware/rateLimiter";

const router = Router();

// ─── Multer: memory storage → Cloudinary ────────────────────────────────────
// UI allows 25 MB per file; max 5 files per submission
const SUBMISSION_MAX_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

const submissionUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: SUBMISSION_MAX_SIZE,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error(`File type "${file.mimetype}" is not allowed`));
    }
    cb(null, true);
  },
});

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /app/assignments/stats
 * Student assignment stats (submitted/pending/accepted counts)
 * Must be BEFORE /:id to avoid route collision
 */
router.get(
  "/stats",
  isStudent,
  appReadRateLimiter,
  assignmentsController.getMyStats.bind(assignmentsController)
);

/**
 * GET /app/assignments
 * Students:  all assignments for their batch (role-aware)
 *   ?status=pending|completed  — filter by tab
 * Teachers/Admins: all assignments with submission stats
 *   ?batchId=&page=&limit=&includeExpired=
 */
router.get(
  "/",
  isAppUser,
  appReadRateLimiter,
  assignmentsController.getAssignments.bind(assignmentsController)
);

/**
 * GET /app/assignments/:id
 * Assignment detail with student's own submission (if any)
 */
router.get(
  "/:id",
  isAppUser,
  appReadRateLimiter,
  assignmentsController.getAssignmentById.bind(assignmentsController)
);

/**
 * POST /app/assignments/:id/submit
 * Student submits assignment files + optional note
 * Body (multipart/form-data):
 *   files[]  — up to 5 files, 25 MB each
 *   note     — optional text (max 1000 chars)
 *
 * Rate limit: 10 uploads per 5 min per IP
 * Security: magic number validation + Cloudinary upload
 */
router.post(
  "/:id/submit",
  isStudent,
  fileUploadRateLimiter,
  submissionUpload.array("files", 5),
  assignmentsController.submitAssignment.bind(assignmentsController)
);

/**
 * GET /app/assignments/:id/my-submission
 * Student views their own submission for a slot
 */
router.get(
  "/:id/my-submission",
  isStudent,
  appReadRateLimiter,
  assignmentsController.getMySubmission.bind(assignmentsController)
);

/**
 * GET /app/assignments/:id/submissions
 * Teacher/Admin: all student submissions for a slot
 *   ?status=PENDING|ACCEPTED|REJECTED&page=&limit=
 */
router.get(
  "/:id/submissions",
  isAppUser,
  appReadRateLimiter,
  assignmentsController.getSlotSubmissions.bind(assignmentsController)
);

/**
 * GET /app/assignments/submissions/:submissionId
 * Teacher/Admin: single submission detail with attachments
 */
router.get(
  "/submissions/:submissionId",
  isAppUser,
  appReadRateLimiter,
  assignmentsController.getSubmissionById.bind(assignmentsController)
);

/**
 * PUT /app/assignments/submissions/:submissionId/review
 * Teacher/Admin: review and grade a submission
 * Body: { status: "ACCEPTED"|"REJECTED", feedback?: string }
 */
router.put(
  "/submissions/:submissionId/review",
  isAppUser,
  assignmentsController.reviewSubmission.bind(assignmentsController)
);

export default router;
