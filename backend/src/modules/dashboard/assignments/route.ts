import { Router } from "express";
import { assignmentController } from "./controller";
import { isAdmin, isAdminOrTeacher, isAuthenticated } from "../../auth/middleware";
import { assignmentUpload, submissionUpload } from "../../../config/multer.config";
import { validateQuery } from "../../auth/validations.auth";
import { AssignmentValidations } from "./validation";

const router = Router();

// All routes require authentication — ensures 401 (not 404) for unauthenticated requests
router.use(isAuthenticated);

// ==================== ASSIGNMENT SLOTS (Admin/Teacher) ====================

// Create assignment slot with optional file attachments
router.post(
  "/slots",
  isAdminOrTeacher,
  assignmentUpload.array("attachments", 5),
  assignmentController.createSlot.bind(assignmentController)
);

// Get all assignment slots
router.get(
  "/slots",
  isAuthenticated,
  validateQuery(AssignmentValidations.slotsQuery),
  assignmentController.getSlots.bind(assignmentController)
);

// Get single assignment slot
router.get(
  "/slots/:id",
  isAuthenticated,
  assignmentController.getSlotById.bind(assignmentController)
);

// Update assignment slot with optional file attachments
router.put(
  "/slots/:id",
  isAdminOrTeacher,
  assignmentUpload.array("attachments", 5),
  assignmentController.updateSlot.bind(assignmentController)
);

// Delete assignment slot (soft delete)
router.delete(
  "/slots/:id",
  isAdminOrTeacher,
  assignmentController.deleteSlot.bind(assignmentController)
);

// Get slot submission stats
router.get(
  "/slots/:slotId/stats",
  isAdminOrTeacher,
  assignmentController.getSlotStats.bind(assignmentController)
);

// ==================== STUDENT SUBMISSIONS ====================

// Submit assignment (students)
router.post(
  "/submissions",
  isAuthenticated,
  submissionUpload.array("files", 10),
  assignmentController.createSubmission.bind(assignmentController)
);

// Get all submissions (Admin/Teacher view)
router.get(
  "/submissions",
  isAdminOrTeacher,
  validateQuery(AssignmentValidations.submissionsQuery),
  assignmentController.getSubmissions.bind(assignmentController)
);

// Get single submission
router.get(
  "/submissions/:id",
  isAuthenticated,
  assignmentController.getSubmissionById.bind(assignmentController)
);

// Get my submission for a slot (students)
router.get(
  "/slots/:slotId/my-submission",
  isAuthenticated,
  assignmentController.getMySubmission.bind(assignmentController)
);

// Review submission (Admin/Teacher)
router.put(
  "/submissions/:id/review",
  isAdminOrTeacher,
  assignmentController.reviewSubmission.bind(assignmentController)
);

// Get student assignment stats
router.get(
  "/students/:studentId/stats",
  isAuthenticated,
  assignmentController.getStudentStats.bind(assignmentController)
);

export default router;
