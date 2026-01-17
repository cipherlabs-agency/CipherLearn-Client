import { Router } from "express";
import { studyMaterialController } from "./controller";
import { isAdminOrTeacher, isAuthenticated } from "../../auth/middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads", "study-materials");
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
    cb(null, `material-${uniqueSuffix}${ext}`);
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
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, image, Word, and PowerPoint files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max per file
    files: 10, // Max 10 files
  },
});

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
