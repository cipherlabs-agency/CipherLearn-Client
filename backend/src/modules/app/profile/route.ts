import { Router } from "express";
import { profileController } from "./controller";
import { isTeacher, isStudent } from "../../auth/middleware";
import { appReadRateLimiter } from "../../../middleware/rateLimiter";

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
  profileController.updateTeacherProfile.bind(profileController)
);

// ==================== STUDENT ROUTES ====================

/**
 * GET /app/profile
 * Student: get own profile (auth enforced in app/route.ts via isStudent)
 */
router.get("/", profileController.getProfile.bind(profileController));

/**
 * PUT /app/profile
 * Student: update phone, address, parentName
 */
router.put("/", isStudent, profileController.updateProfile.bind(profileController));

export default router;
