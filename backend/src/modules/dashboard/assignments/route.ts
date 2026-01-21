import { Router } from "express";
import { assignmentController } from "./controller";
import { isAdmin, isAdminOrTeacher, isAuthenticated } from "../../auth/middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads", "assignments");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `assignment-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 10, // Max 10 files
  },
});

const router = Router();

// ==================== ASSIGNMENT SLOTS (Admin/Teacher) ====================

// Create assignment slot
router.post(
  "/slots",
  isAdminOrTeacher,
  assignmentController.createSlot.bind(assignmentController)
);

// Get all assignment slots
router.get(
  "/slots",
  isAuthenticated,
  assignmentController.getSlots.bind(assignmentController)
);

// Get single assignment slot
router.get(
  "/slots/:id",
  isAuthenticated,
  assignmentController.getSlotById.bind(assignmentController)
);

// Update assignment slot
router.put(
  "/slots/:id",
  isAdminOrTeacher,
  assignmentController.updateSlot.bind(assignmentController)
);

// Delete assignment slot (soft delete)
router.delete(
  "/slots/:id",
  isAdminOrTeacher,
  assignmentController.deleteSlot.bind(assignmentController)
);

// Get slot submission stats
router.get(
  "/slots/:slotId/stats",
  isAdminOrTeacher,
  assignmentController.getSlotStats.bind(assignmentController)
);

// ==================== STUDENT SUBMISSIONS ====================

// Submit assignment (students)
router.post(
  "/submissions",
  isAuthenticated,
  upload.array("files", 10),
  assignmentController.createSubmission.bind(assignmentController)
);

// Get all submissions (Admin/Teacher view)
router.get(
  "/submissions",
  isAdminOrTeacher,
  assignmentController.getSubmissions.bind(assignmentController)
);

// Get single submission
router.get(
  "/submissions/:id",
  isAuthenticated,
  assignmentController.getSubmissionById.bind(assignmentController)
);

// Get my submission for a slot (students)
router.get(
  "/slots/:slotId/my-submission",
  isAuthenticated,
  assignmentController.getMySubmission.bind(assignmentController)
);

// Review submission (Admin/Teacher)
router.put(
  "/submissions/:id/review",
  isAdminOrTeacher,
  assignmentController.reviewSubmission.bind(assignmentController)
);

// Get student assignment stats
router.get(
  "/students/:studentId/stats",
  isAuthenticated,
  assignmentController.getStudentStats.bind(assignmentController)
);

export default router;
