import { Router } from "express";
import multer from "multer";
import { validateRequest, validateQuery } from "../../auth/validations.auth";
import { TestValidations } from "./validation";
import TestController from "./controller";
import { isAdmin, isAdminOrTeacher } from "../../auth/middleware";

const router = Router();
const controller = new TestController();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Create test (Admin or Teacher)
router.post(
  "/",
  isAdminOrTeacher,
  validateRequest(TestValidations.create),
  controller.create.bind(controller)
);

// Get all tests (Admin or Teacher)
router.get("/", isAdminOrTeacher, validateQuery(TestValidations.list), controller.getAll.bind(controller));

// Get test statistics (Admin or Teacher) - must be before /:id
router.get("/:id/stats", isAdminOrTeacher, controller.getStats.bind(controller));

// Get paginated test scores - must be before /:id
router.get("/:id/scores", isAdminOrTeacher, validateQuery(TestValidations.scoresQuery), controller.getScores.bind(controller));

// Get test by ID (Admin or Teacher)
router.get("/:id", isAdminOrTeacher, controller.getById.bind(controller));

// Update test (Admin or Teacher)
router.put(
  "/:id",
  isAdminOrTeacher,
  validateRequest(TestValidations.update),
  controller.update.bind(controller)
);

// Delete test (Admin only)
router.delete("/:id", isAdmin, controller.delete.bind(controller));

// Publish test scores (Admin or Teacher)
router.put("/:id/publish", isAdminOrTeacher, controller.publish.bind(controller));

// Upload single score (Admin or Teacher)
router.post(
  "/:id/scores",
  isAdminOrTeacher,
  validateRequest(TestValidations.uploadScore),
  controller.uploadScore.bind(controller)
);

// Upload scores via CSV (Admin or Teacher)
router.post(
  "/:id/scores/bulk",
  isAdminOrTeacher,
  upload.single("file"),
  controller.uploadScoresBulk.bind(controller)
);

// Update a score (Admin or Teacher)
router.put(
  "/:id/scores/:scoreId",
  isAdminOrTeacher,
  validateRequest(TestValidations.updateScore),
  controller.updateScore.bind(controller)
);

export default router;
