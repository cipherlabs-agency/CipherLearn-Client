import { Router } from "express";
import { validateRequest, validateQuery } from "../../auth/validations.auth";
import { YoutubeVideoValidations } from "./validation";
import YoutubeVideoController from "./controller";
import { isAdmin, isAuthenticated } from "../../auth/middleware";

const router = Router();
const controller = new YoutubeVideoController();

// All routes require authentication
router.use(isAuthenticated);

// Get categories (must be before /:id to avoid conflict)
router.get("/categories", controller.getCategories.bind(controller));

// Get all videos with filtering and pagination
router.get(
  "/",
  validateQuery(YoutubeVideoValidations.getQuery),
  controller.getAll.bind(controller)
);

// Get videos for a specific batch
router.get("/batch/:batchId", controller.getByBatch.bind(controller));

// Get a single video by ID
router.get("/:id", controller.getById.bind(controller));

// Upload a new video (Admin only)
router.post(
  "/upload",
  isAdmin,
  validateRequest(YoutubeVideoValidations.upload),
  controller.upload.bind(controller)
);

// Update a video (Admin only)
router.put(
  "/:id",
  isAdmin,
  validateRequest(YoutubeVideoValidations.update),
  controller.update.bind(controller)
);

// Soft delete (draft) a video (Admin only)
router.put("/:videoId/draft", isAdmin, controller.draft.bind(controller));

// Restore a soft-deleted video (Admin only)
router.put("/:id/restore", isAdmin, controller.restore.bind(controller));

// Permanently delete a video (Admin only)
router.delete("/:id", isAdmin, controller.delete.bind(controller));

export default router;
