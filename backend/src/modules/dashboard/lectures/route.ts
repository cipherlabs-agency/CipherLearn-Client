import { Router } from "express";
import { validateRequest, validateQuery } from "../../auth/validations.auth";
import { LectureValidations } from "./validation";
import LectureController from "./controller";
import { isAdmin, isAdminOrTeacher } from "../../auth/middleware";

const router = Router();
const controller = new LectureController();

// Create lecture (Admin only)
router.post(
  "/",
  isAdmin,
  validateRequest(LectureValidations.create),
  controller.create.bind(controller)
);

// Create recurring lectures (Admin only)
router.post(
  "/bulk",
  isAdmin,
  validateRequest(LectureValidations.createBulk),
  controller.createBulk.bind(controller)
);

// Get schedule view (Admin or Teacher)
router.get("/schedule", isAdminOrTeacher, controller.getSchedule.bind(controller));

// Get all lectures (Admin or Teacher)
router.get("/", isAdminOrTeacher, validateQuery(LectureValidations.list), controller.getAll.bind(controller));

// Get lecture by ID (Admin or Teacher)
router.get("/:id", isAdminOrTeacher, controller.getById.bind(controller));

// Update lecture (Admin only)
router.put(
  "/:id",
  isAdmin,
  validateRequest(LectureValidations.update),
  controller.update.bind(controller)
);

// Assign teacher (Admin only)
router.put(
  "/:id/assign",
  isAdmin,
  validateRequest(LectureValidations.assign),
  controller.assignTeacher.bind(controller)
);

// Update status (Admin or Teacher)
router.put(
  "/:id/status",
  isAdminOrTeacher,
  validateRequest(LectureValidations.updateStatus),
  controller.updateStatus.bind(controller)
);

// Delete lecture (Admin only)
router.delete("/:id", isAdmin, controller.delete.bind(controller));

export default router;
