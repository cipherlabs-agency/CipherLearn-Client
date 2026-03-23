import { Router } from "express";
import { doubtsController } from "./controller";
import { isStudent, isTeacher, isAppUser } from "../../auth/middleware";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import { validate } from "../../../middleware/validate";
import { DoubtsValidations } from "./validation";

const router = Router();

// ==================== TEACHER ROUTES (before /:id) ====================

/**
 * GET /app/doubts/teacher
 * Teacher: list doubts from their batch students
 *   ?batchId=&status=OPEN|ANSWERED|RESOLVED&page=&limit=
 */
router.get(
  "/teacher",
  isTeacher,
  appReadRateLimiter,
  validate(DoubtsValidations.listQuery, "query"),
  doubtsController.getTeacherDoubts.bind(doubtsController)
);

/**
 * POST /app/doubts/:id/reply
 * Teacher: post a reply to a student's doubt
 * Body: { body: string }
 */
router.post(
  "/:id/reply",
  isTeacher,
  appWriteRateLimiter,
  validate(DoubtsValidations.replyToDoubt),
  doubtsController.replyToDoubt.bind(doubtsController)
);

/**
 * PUT /app/doubts/:id/resolve
 * Teacher or Student: mark a doubt as resolved
 */
router.put(
  "/:id/resolve",
  isAppUser,
  appWriteRateLimiter,
  doubtsController.resolveDoubt.bind(doubtsController)
);

// ==================== STUDENT ROUTES ====================

/**
 * GET /app/doubts
 * Student: list all my doubts (paginated)
 *   ?page=&limit=
 */
router.get(
  "/",
  isStudent,
  appReadRateLimiter,
  validate(DoubtsValidations.listQuery, "query"),
  doubtsController.getMyDoubts.bind(doubtsController)
);

/**
 * POST /app/doubts
 * Student: post a new doubt
 * Body: { title, description, subject? }
 */
router.post(
  "/",
  isStudent,
  appWriteRateLimiter,
  validate(DoubtsValidations.postDoubt),
  doubtsController.postDoubt.bind(doubtsController)
);

/**
 * GET /app/doubts/:id
 * Student: view a doubt thread (all replies)
 */
router.get(
  "/:id",
  isStudent,
  appReadRateLimiter,
  doubtsController.getDoubtThread.bind(doubtsController)
);

export default router;
