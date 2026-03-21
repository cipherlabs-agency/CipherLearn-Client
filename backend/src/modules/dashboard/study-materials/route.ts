import { Router } from "express";
import { studyMaterialController } from "./controller";
import { isAdminOrTeacher, isAuthenticated } from "../../auth/middleware";
import { materialUpload as upload } from "../../../config/multer.config";

const router = Router();

// Get categories
router.get(
  "/categories",
  isAuthenticated,
  studyMaterialController.getCategories.bind(studyMaterialController)
);

// Admin/Teacher routes - CRUD
router.post(
  "/",
  isAdminOrTeacher,
  upload.array("files", 10),
  studyMaterialController.create.bind(studyMaterialController)
);

router.get(
  "/",
  isAuthenticated,
  studyMaterialController.getAll.bind(studyMaterialController)
);

router.get(
  "/:id",
  isAuthenticated,
  studyMaterialController.getById.bind(studyMaterialController)
);

router.put(
  "/:id",
  isAdminOrTeacher,
  upload.array("files", 10),
  studyMaterialController.update.bind(studyMaterialController)
);

router.delete(
  "/:id",
  isAdminOrTeacher,
  studyMaterialController.delete.bind(studyMaterialController)
);

export default router;
