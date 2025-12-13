import { Router } from "express";
import BatchController from "./controller";
import { isAdmin } from "../../auth/middleware";
import { validateRequest } from "../../auth/validations.auth";
import { BatchValidations } from "./validation";

const router = Router();
const controller = new BatchController();

router.post(
  "/",
  isAdmin,
  validateRequest(BatchValidations.batch),
  controller.create.bind(controller)
);
router.put("/:id", controller.update.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.post("/draft", isAdmin, controller.draft.bind(controller));
router.get("/drafts", isAdmin, controller.getDrafts.bind(controller));
router.delete("/", isAdmin, controller.delete.bind(controller));

export default router;
