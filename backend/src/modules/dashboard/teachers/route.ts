import { Router } from "express";
import { validateRequest, validateQuery } from "../../auth/validations.auth";
import { TeacherValidations } from "./validation";
import TeacherController from "./controller";
import { isAdmin } from "../../auth/middleware";

const router = Router();
const controller = new TeacherController();

// All routes require Admin access
router.use(isAdmin);

// Create a new teacher
router.post(
  "/",
  validateRequest(TeacherValidations.create),
  controller.create.bind(controller)
);

// Get all teachers
router.get("/", validateQuery(TeacherValidations.list), controller.getAll.bind(controller));

// Get a single teacher by ID
router.get("/:id", controller.getById.bind(controller));

// Update a teacher
router.put(
  "/:id",
  validateRequest(TeacherValidations.update),
  controller.update.bind(controller)
);

// Delete a teacher
router.delete("/:id", controller.delete.bind(controller));

export default router;
