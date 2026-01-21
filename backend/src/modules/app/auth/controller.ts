import { Request, Response } from "express";
import * as authService from "./service";
import {
  checkEnrollmentSchema,
  setupPasswordSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "./validations";
import logger from "../../../utils/logger";

/**
 * Get client IP address
 */
const getClientIP = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
};

/**
 * Check if email is enrolled
 * POST /app/auth/check-enrollment
 */
export const checkEnrollment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { error, value } = checkEnrollmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const result = await authService.checkEnrollment(value.email);
    return res.status(200).json(result);
  } catch (err) {
    logger.error("Check enrollment error:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

/**
 * Setup password for first-time student
 * POST /app/auth/setup-password
 */
export const setupPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { error, value } = setupPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const ipAddress = getClientIP(req);
    const userAgent = req.headers["user-agent"];

    const result = await authService.setupPassword(
      value.email,
      value.password,
      ipAddress,
      userAgent
    );

    const statusCode = result.success ? 201 : 400;
    return res.status(statusCode).json(result);
  } catch (err) {
    logger.error("Setup password error:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

/**
 * Student login
 * POST /app/auth/login
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const ipAddress = getClientIP(req);
    const userAgent = req.headers["user-agent"];

    const result = await authService.login(
      value.email,
      value.password,
      ipAddress,
      userAgent
    );

    const statusCode = result.success ? 200 : 401;
    return res.status(statusCode).json(result);
  } catch (err) {
    logger.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

/**
 * Student logout
 * POST /app/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header provided",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const result = await authService.logout(token, userId);
    return res.status(200).json(result);
  } catch (err) {
    logger.error("Logout error:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

/**
 * Refresh access token
 * POST /app/auth/refresh-token
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const result = await authService.refreshAccessToken(value.refreshToken);

    const statusCode = result.success ? 200 : 401;
    return res.status(statusCode).json(result);
  } catch (err) {
    logger.error("Refresh token error:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

/**
 * Request password reset
 * POST /app/auth/forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const ipAddress = getClientIP(req);
    const result = await authService.forgotPassword(value.email, ipAddress);

    return res.status(200).json(result);
  } catch (err) {
    logger.error("Forgot password error:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

/**
 * Verify OTP
 * POST /app/auth/verify-otp
 */
export const verifyOTP = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { error, value } = verifyOTPSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const ipAddress = getClientIP(req);
    const userAgent = req.headers["user-agent"];

    const result = await authService.verifyPasswordResetOTP(
      value.email,
      value.otp,
      ipAddress,
      userAgent
    );

    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (err) {
    logger.error("Verify OTP error:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

/**
 * Reset password
 * POST /app/auth/reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const ipAddress = getClientIP(req);
    const userAgent = req.headers["user-agent"];

    const result = await authService.resetPassword(
      value.resetToken,
      value.password,
      ipAddress,
      userAgent
    );

    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (err) {
    logger.error("Reset password error:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

/**
 * Get current user profile
 * GET /app/auth/me
 */
export const getMe = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const result = await authService.getCurrentUser(userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error("Get me error:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};
