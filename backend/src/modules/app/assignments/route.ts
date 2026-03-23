import { Router } from "express";
import { assignmentsController } from "./controller";
import { isStudent, isAppUser, isTeacher } from "../../auth/middleware";
import { fileUploadRateLimiter, appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import { submissionUpload, assignmentUpload } from "../../../config/multer.config";
import { validate } from "../../../middleware/validate";
import { AssignmentsValidations } from "./validation";

const router = Router();

// ─── Routes ─────────────────────────────────────────────────────────────────

// ==================== TEACHER ROUTES (before /:id to avoid conflicts) ====================

/**
 * GET /app/assignments/teacher/stats
 * Teacher: quick stats — due today count + pending submissions to review
 */
router.get(
  "/teacher/stats",
  isTeacher,
  appReadRateLimiter,
  assignmentsController.getTeacherStats.bind(assignmentsController)
);

/**
 * GET /app/assignments/teacher
 * Teacher: list their assignments with tab filter
 *   ?tab=active|drafts|graded&batchId=&page=&limit=
 */
router.get(
  "/teacher",
  isTeacher,
  appReadRateLimiter,
  assignmentsController.getTeacherAssignments.bind(assignmentsController)
);

/**
 * POST /app/assignments/teacher
 * Teacher: create assignment for one or more batches
 * Body (multipart/form-data): title, subject, description?, batchIds (JSON),
 *   dueDate?, submissionType?, assignmentStatus?, allowLateSubmissions?,
 *   plagiarismCheck?, files[] (optional brief attachments, 50MB max)
 *
 * Rate limit: 10 uploads per 5 min
 */
router.post(
  "/teacher",
  isTeacher,
  fileUploadRateLimiter,
  assignmentUpload.array("files", 5),
  validate(AssignmentsValidations.createAssignment),
  assignmentsController.createAssignment.bind(assignmentsController)
);

/**
 * GET /app/assignments/teacher/:id/review
 * Teacher: per-student review page (SUBMITTED/LATE/MISSING)
 *   ?status=submitted|not_submitted|late
 */
router.get(
  "/teacher/:id/review",
  isTeacher,
  appReadRateLimiter,
  assignmentsController.getAssignmentReviewPage.bind(assignmentsController)
);

/**
 * PUT /app/assignments/teacher/:id
 * Teacher: update assignment details (must own it)
 * Body (JSON): { title?, subject?, description?, dueDate?, submissionType?,
 *               assignmentStatus?, allowLateSubmissions?, plagiarismCheck? }
 */
router.put(
  "/teacher/:id",
  isTeacher,
  appWriteRateLimiter,
  validate(AssignmentsValidations.updateAssignment),
  assignmentsController.updateAssignment.bind(assignmentsController)
);

/**
 * DELETE /app/assignments/teacher/:id
 * Teacher: soft-delete assignment (must own it)
 */
router.delete(
  "/teacher/:id",
  isTeacher,
  assignmentsController.deleteAssignment.bind(assignmentsController)
);

// ==================== STUDENT ROUTES ====================

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
  validate(AssignmentsValidations.listQuery, "query"),
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
  appWriteRateLimiter,
  validate(AssignmentsValidations.reviewSubmission),
  assignmentsController.reviewSubmission.bind(assignmentsController)
);

export default router;
