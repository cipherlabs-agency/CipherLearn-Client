import { Router } from "express";
import { profileController } from "./controller";
import { isTeacher, isStudent } from "../../auth/middleware";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import { avatarUpload } from "../../../config/multer.config";
import { validate } from "../../../middleware/validate";
import { ProfileValidations } from "./validation";

const router = Router();

// ==================== TEACHER ROUTES (before student routes) ====================

/**
 * GET /app/profile/teacher
 * Teacher: get own profile with extended info + computed workload
 */
router.get(
  "/teacher",
  isTeacher,
  appReadRateLimiter,
  profileController.getTeacherProfile.bind(profileController)
);

/**
 * PUT /app/profile/teacher
 * Teacher: update own extended profile
 * Body (JSON): { phone?, gender?, qualification?, university?, experience?, workTimingFrom?, workTimingTo?, primarySubjects?, secondarySubjects?, bio? }
 */
router.put(
  "/teacher",
  isTeacher,
  appWriteRateLimiter,
  validate(ProfileValidations.updateTeacherProfile),
  profileController.updateTeacherProfile.bind(profileController)
);

/**
 * PUT /app/profile/teacher/avatar
 * Teacher: upload profile photo (multipart, field: "avatar")
 */
router.put(
  "/teacher/avatar",
  isTeacher,
  avatarUpload.single("avatar"),
  profileController.uploadTeacherAvatar.bind(profileController)
);

// ==================== STUDENT ROUTES ====================

/**
 * GET /app/profile
 * Student: get own profile
 */
router.get("/", isStudent, profileController.getProfile.bind(profileController));

/**
 * PUT /app/profile
 * Student: update phone, address, parentName
 */
router.put("/", isStudent, appWriteRateLimiter, validate(ProfileValidations.updateStudentProfile), profileController.updateProfile.bind(profileController));

/**
 * PUT /app/profile/avatar
 * Student: upload profile photo (multipart, field: "avatar")
 */
router.put(
  "/avatar",
  isStudent,
  avatarUpload.single("avatar"),
  profileController.uploadAvatar.bind(profileController)
);

export default router;
