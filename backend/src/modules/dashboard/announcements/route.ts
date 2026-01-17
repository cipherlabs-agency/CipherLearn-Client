import { Router } from "express";
import { announcementController } from "./controller";
import { isAdmin, isAuthenticated } from "../../auth/middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads", "announcements");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `announcement-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

const router = Router();

// Get active announcements (public - for students)
router.get(
  "/active",
  isAuthenticated,
  announcementController.getActive.bind(announcementController)
);

// Admin routes
router.post(
  "/",
  isAdmin,
  upload.single("image"),
  announcementController.create.bind(announcementController)
);

router.get(
  "/",
  isAdmin,
  announcementController.getAll.bind(announcementController)
);

router.get(
  "/:id",
  isAdmin,
  announcementController.getById.bind(announcementController)
);

router.put(
  "/:id",
  isAdmin,
  upload.single("image"),
  announcementController.update.bind(announcementController)
);

router.delete(
  "/:id",
  isAdmin,
  announcementController.delete.bind(announcementController)
);

export default router;
