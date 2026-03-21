import { Router } from "express";
import { announcementController } from "./controller";
import { isAdmin, isAdminOrTeacher, isAuthenticated } from "../../auth/middleware";
import upload from "../../../config/multer.config";

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
  announcementController.create.bind(announcementController)
);

router.get(
  "/",
  isAdminOrTeacher,
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
