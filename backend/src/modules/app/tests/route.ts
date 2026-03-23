import { Router } from "express";
import { isAppUser, isStudent, isTeacher } from "../../auth/middleware";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import AppTestController from "./controller";
import { validate } from "../../../middleware/validate";
import { TestsValidations } from "./validation";

const router = Router();
const controller = new AppTestController();

// ==================== TEACHER ROUTES (before /:id) ====================

/**
 * GET /app/tests/teacher
 * Teacher: list their tests with grading status
 *   ?batchId=&subject=&status=&page=&limit=
 */
router.get(
  "/teacher",
  isTeacher,
  appReadRateLimiter,
  validate(TestsValidations.teacherTestsQuery, "query"),
  controller.getTeacherTests.bind(controller)
);

/**
 * GET /app/tests/teacher/:id/score-sheet
 * Teacher: get test with all student score slots
 */
router.get(
  "/teacher/:id/score-sheet",
  isTeacher,
  appReadRateLimiter,
  controller.getScoreSheet.bind(controller)
);

/**
 * PUT /app/tests/teacher/:id/scores
 * Teacher: bulk save scores
 * Body: { scores: [{ studentId, marksObtained, remarks? }] }
 */
router.put(
  "/teacher/:id/scores",
  isTeacher,
  appWriteRateLimiter,
  validate(TestsValidations.bulkSaveScores),
  controller.bulkSaveScores.bind(controller)
);

/**
 * PUT /app/tests/teacher/:id/publish
 * Teacher: publish results (locks scores)
 */
router.put(
  "/teacher/:id/publish",
  isTeacher,
  controller.publishResults.bind(controller)
);

/**
 * GET /app/tests/teacher/:id/summary
 * Teacher: class stats (average, highest, lowest, distribution)
 */
router.get(
  "/teacher/:id/summary",
  isTeacher,
  appReadRateLimiter,
  controller.getTestSummary.bind(controller)
);

/**
 * GET /app/tests/teacher/:id/export-csv
 * Teacher: download all student scores as CSV
 */
router.get(
  "/teacher/:id/export-csv",
  isTeacher,
  controller.exportCsv.bind(controller)
);

// ==================== STUDENT ROUTES ====================

// Student: get my tests (with optional filter: upcoming, complete, results)
router.get("/", isAppUser, appReadRateLimiter, validate(TestsValidations.studentTestsQuery, "query"), controller.getTests.bind(controller));

// Student: toggle/remove test reminder (BEFORE /:id to avoid conflict)
router.post("/:id/remind", isAppUser, controller.toggleReminder.bind(controller));
router.delete("/:id/remind", isAppUser, controller.removeReminder.bind(controller));

// Student: performance analytics
router.get("/performance", isStudent, controller.getPerformance.bind(controller));

// Teacher: view batch tests (legacy route kept)
router.get("/batch/:batchId", isAppUser, controller.getBatchTests.bind(controller));

// Get test detail (Student gets their score, Teacher gets test info)
router.get("/:id", isAppUser, controller.getTestDetail.bind(controller));

// Teacher: view all scores for a test (legacy route kept)
router.get("/:id/scores", isAppUser, controller.getTestScores.bind(controller));

export default router;
