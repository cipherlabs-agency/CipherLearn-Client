import { Router } from "express";
import { announcementController } from "./controller";
import { isAdmin, isAdminOrTeacher, isAuthenticated } from "../../auth/middleware";
import upload from "../../../config/multer.config";
import { validateRequest, validateQuery } from "../../auth/validations.auth";
import { AnnouncementValidations } from "./validation";

const router = Router();

// Get active announcements (public - for students)
router.get(
  "/active",
  isAuthenticated,
  announcementController.getActive.bind(announcementController)
);

// Admin/Teacher routes
router.post(
  "/",
  isAdminOrTeacher,
  upload.single("image"),
  validateRequest(AnnouncementValidations.create),
  announcementController.create.bind(announcementController)
);

router.get(
  "/",
  isAdminOrTeacher,
  validateQuery(AnnouncementValidations.listQuery),
  announcementController.getAll.bind(announcementController)
);

router.get(
  "/:id",
  isAdminOrTeacher,
  announcementController.getById.bind(announcementController)
);

router.put(
  "/:id",
  isAdminOrTeacher,
  upload.single("image"),
  announcementController.update.bind(announcementController)
);

// Permanently delete (Admin only - destructive action)
router.delete(
  "/:id",
  isAdmin,
  announcementController.delete.bind(announcementController)
);

export default router;
