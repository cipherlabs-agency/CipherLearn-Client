import { Router } from "express";
import { validateRequest } from "../../auth/validations.auth";
import { StudentValidations } from "./validation";
import StudentEnrollmentController from "./controller";
import upload from "../../../config/multer.config";
import { isAdmin, isAuthenticated } from "../../auth/middleware";

const router = Router();
const controller = new StudentEnrollmentController();

// All routes require authentication
router.use(isAuthenticated);

// =====================
// STUDENT PROFILE (for authenticated students)
// =====================

// Get current user's student profile (matches by email)
router.get("/my-profile", controller.getMyProfile.bind(controller));

// =====================
// CSV OPERATIONS
// =====================

// Download sample CSV template
router.get("/csv/template", controller.downloadTemplate.bind(controller));

// Preview CSV data before import (Admin only)
router.post(
  "/csv/preview",
  isAdmin,
  upload.single("file"),
  controller.previewCSV.bind(controller)
);

// Import students from CSV (Admin only)
router.post(
  "/csv/import",
  isAdmin,
  upload.single("file"),
  controller.enrollCSV.bind(controller)
);

// =====================
// SINGLE STUDENT OPERATIONS
// =====================

// Enroll a single student (Admin only) — POST / or POST /enroll both accepted
router.post(
  "/",
  isAdmin,
  validateRequest(StudentValidations.enroll),
  controller.enrollSingle.bind(controller)
);
router.post(
  "/enroll",
  isAdmin,
  validateRequest(StudentValidations.enroll),
  controller.enrollSingle.bind(controller)
);

// Get a single student by ID
router.get("/student/:id", controller.getById.bind(controller));

// Update a student (Admin only)
router.put("/student/:id", isAdmin, controller.update.bind(controller));

// Delete a student (Admin only)
router.delete("/student/:id", isAdmin, controller.delete.bind(controller));

// =====================
// LIST OPERATIONS
// =====================

// Get all students (optionally filter by batch)
router.get("/students", controller.getAll.bind(controller));
router.get("/students/:id", controller.getAll.bind(controller));

// =====================
// DELETED STUDENTS & RESTORE (Admin only)
// =====================

// Get all soft-deleted students
router.get("/deleted", isAdmin, controller.getDeleted.bind(controller));

// Restore soft-deleted students
router.put("/restore", isAdmin, controller.restore.bind(controller));

// =====================
// DANGER ZONE - HARD DELETE (Admin only)
// =====================

// Permanently delete a student
router.delete("/hard-delete/:id", isAdmin, controller.hardDelete.bind(controller));

// Permanently delete multiple students
router.delete("/hard-delete-many", isAdmin, controller.hardDeleteMany.bind(controller));

// Purge all soft-deleted students
router.delete("/purge-deleted", isAdmin, controller.purgeDeleted.bind(controller));

export default router;
