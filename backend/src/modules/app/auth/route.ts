import { Router } from "express";
import * as authController from "./controller";
import {
  loginRateLimiter,
  passwordResetRateLimiter,
  enrollmentCheckRateLimiter,
  tokenRefreshRateLimiter,
  generalRateLimiter,
} from "../../../middleware/rateLimiter";
import { isAppUser } from "../../auth/middleware";

const router = Router();

// Public routes (no authentication required)

// Check if student is enrolled
router.post(
  "/check-enrollment",
  enrollmentCheckRateLimiter,
  authController.checkEnrollment
);

// First-time password setup
router.post(
  "/setup-password",
  loginRateLimiter,
  authController.setupPassword
);

// Login
router.post(
  "/login",
  loginRateLimiter,
  authController.login
);

// Refresh token
router.post(
  "/refresh-token",
  tokenRefreshRateLimiter,
  authController.refreshToken
);

// Password reset flow
router.post(
  "/forgot-password",
  passwordResetRateLimiter,
  authController.forgotPassword
);

router.post(
  "/verify-otp",
  loginRateLimiter,
  authController.verifyOTP
);

router.post(
  "/reset-password",
  loginRateLimiter,
  authController.resetPassword
);

// Protected routes (authentication required)

// Logout
router.post(
  "/logout",
  generalRateLimiter,
  isAppUser,
  authController.logout
);

// Get current user profile
router.get(
  "/me",
  generalRateLimiter,
  isAppUser,
  authController.getMe
);

// Change password (requires current password)
router.post(
  "/change-password",
  generalRateLimiter,
  isAppUser,
  authController.changePassword
);

export default router;
