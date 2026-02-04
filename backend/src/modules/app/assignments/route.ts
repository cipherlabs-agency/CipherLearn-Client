import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { assignmentsController } from "./controller";
import { isStudent, isAppUser } from "../../auth/middleware";

const router = Router();

// Configure multer for submission file uploads
const submissionsDir = path.join(process.cwd(), "uploads", "submissions");
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, submissionsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `submission-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
    "image/gif",
    "text/plain",
    "application/zip",
    "application/x-zip-compressed",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ==================== ROUTES ====================

// Student stats - must be before :id routes
router.get(
  "/stats",
  isStudent,
  assignmentsController.getMyStats.bind(assignmentsController)
);

// Get all assignments (role-based response)
// Students: their batch assignments with submission status
// Teachers/Admins: all assignments with stats
router.get(
  "/",
  isAppUser,
  assignmentsController.getAssignments.bind(assignmentsController)
);

// Get single assignment
router.get(
  "/:id",
  isAppUser,
  assignmentsController.getAssignmentById.bind(assignmentsController)
);

// Student submit assignment (with file upload)
router.post(
  "/:id/submit",
  isStudent,
  upload.array("files", 5),
  assignmentsController.submitAssignment.bind(assignmentsController)
);

// Get my submission for an assignment (student)
router.get(
  "/:id/my-submission",
  isStudent,
  assignmentsController.getMySubmission.bind(assignmentsController)
);

// Teacher/Admin: Get submissions for a slot
router.get(
  "/:id/submissions",
  isAppUser,
  assignmentsController.getSlotSubmissions.bind(assignmentsController)
);

// Teacher/Admin: Get single submission details
router.get(
  "/submissions/:submissionId",
  isAppUser,
  assignmentsController.getSubmissionById.bind(assignmentsController)
);

// Teacher/Admin: Review a submission
router.put(
  "/submissions/:submissionId/review",
  isAppUser,
  assignmentsController.reviewSubmission.bind(assignmentsController)
);

export default router;
