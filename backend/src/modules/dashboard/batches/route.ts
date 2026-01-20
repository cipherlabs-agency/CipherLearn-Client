import { Router } from "express";
import BatchController from "./controller";
import { isAdmin, isAuthenticated } from "../../auth/middleware";
import { validateRequest } from "../../auth/validations.auth";
import { BatchValidations } from "./validation";

const router = Router();
const controller = new BatchController();

router.use(isAuthenticated);

// =====================
// CRUD OPERATIONS
// =====================
router.post(
  "/",
  isAdmin,
  validateRequest(BatchValidations.batch),
  controller.create.bind(controller)
);
router.put("/:id", isAdmin, controller.update.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.get("/drafts", isAdmin, controller.getDrafts.bind(controller));
router.get("/:id", controller.get.bind(controller));
router.put("/draft", isAdmin, controller.draft.bind(controller));
router.put("/restore", isAdmin, controller.restore.bind(controller));
router.delete("/", isAdmin, controller.delete.bind(controller));

// =====================
// DANGER ZONE - HARD DELETE (Admin only)
// =====================
router.delete("/hard-delete/:id", isAdmin, controller.hardDelete.bind(controller));
router.delete("/purge-deleted", isAdmin, controller.purgeDeleted.bind(controller));

export default router;
