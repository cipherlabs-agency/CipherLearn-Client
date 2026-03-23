import { prisma } from "../../../config/db.config";
import { config } from "../../../config/env.config";
import {
  generateLoginToken,
  generateHash,
  compareHash,
  verifyToken,
} from "../../auth/utils.auth";
import { generateOTP, generateSecureToken, hashOTP, verifyOTP } from "../../../utils/otp";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../../../utils/email";
import { UserRoles } from "../../../../prisma/generated/prisma/enums";
import jwt from "jsonwebtoken";
import logger from "../../../utils/logger";
import {
  CheckUserStatusResponse,
  LoginResponse,
  VerifyOTPResponse,
} from "./types";
import { log } from "../../../utils/logtail";

/**
 * Check if email is registered as a student or teacher
 * Replaces the old checkEnrollment function
 */
export const checkUserStatus = async (
  email: string
): Promise<CheckUserStatusResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // If no user found, email is not registered
  if (!user) {
    return {
      success: true,
      isRegistered: false,
      hasPassword: false,
      message: "Email is not registered in our system",
    };
  }

  // Allow STUDENT, TEACHER, and ADMIN roles for app authentication (admin acts as teacher)
  if (user.role !== UserRoles.STUDENT && user.role !== UserRoles.TEACHER && user.role !== UserRoles.ADMIN) {
    return {
      success: true,
      isRegistered: false,
      hasPassword: false,
      message: "Email is not registered in our system",
    };
  }

  return {
    success: true,
    isRegistered: true,
    hasPassword: user.isPasswordSet && user.password !== null,
    role: user.role,
    userName: user.name,
    message: user.isPasswordSet && user.password
      ? "Account exists. Please login."
      : "Please setup your password.",
  };
};

/**
 * @deprecated Use checkUserStatus instead
 * Kept for backward compatibility
 */
export const checkEnrollment = async (email: string) => {
  const result = await checkUserStatus(email);
  return {
    success: result.success,
    isEnrolled: result.isRegistered,
    hasAccount: result.hasPassword,
    studentName: result.userName,
    message: result.message,
  };
};

/**
 * Setup password for first-time student or teacher
 * Works with existing User records (created during enrollment/teacher creation)
 */
export const setupPassword = async (
  email: string,
  password: string,
  ipAddress: string,
  userAgent?: string
): Promise<{ success: boolean; message: string }> => {
  const normalizedEmail = email.toLowerCase();

  // Find existing user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Check if user exists and has app role (STUDENT or TEACHER)
  if (!user || (user.role !== UserRoles.STUDENT && user.role !== UserRoles.TEACHER)) {
    await logLoginAttempt(normalizedEmail, ipAddress, false, userAgent);
    return { success: false, message: "Email is not registered in our system" };
  }

  // Check if password is already set
  if (user.isPasswordSet && user.password) {
    return {
      success: false,
      message: "Password already set. Please login instead.",
    };
  }

  // Set the password
  const hashedPassword = generateHash(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      isPasswordSet: true,
    },
  });

  await logLoginAttempt(normalizedEmail, ipAddress, true, userAgent);

  // Send welcome email (non-blocking)
  sendWelcomeEmail(normalizedEmail, user.name).catch((err) =>
    logger.error("Failed to send welcome email:", err)
  );

  return {
    success: true,
    message: "Password set successfully. You can now login.",
  };
};

/**
 * Student or Teacher login
 * Supports both STUDENT and TEACHER roles
 */
export const login = async (
  email: string,
  password: string,
  ipAddress: string,
  userAgent?: string
): Promise<LoginResponse> => {
  const normalizedEmail = email.toLowerCase();

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    await logLoginAttempt(normalizedEmail, ipAddress, false, userAgent);
    return { success: false, message: "Invalid email or password" };
  }

  // Check if user has app role (STUDENT or TEACHER)
  if (user.role !== UserRoles.STUDENT && user.role !== UserRoles.TEACHER) {
    await logLoginAttempt(normalizedEmail, ipAddress, false, userAgent);
    return { success: false, message: "Access denied" };
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
    );
    await logLoginAttempt(normalizedEmail, ipAddress, false, userAgent);
    return {
      success: false,
      message: `Account is locked. Try again in ${remainingMinutes} minutes.`,
    };
  }

  // Check if password is set
  if (!user.isPasswordSet || !user.password) {
    return {
      success: false,
      message: "Please set up your password first",
      requiresPasswordSetup: true,
    };
  }

  // Verify password
  const isPasswordValid = compareHash(password, user.password);

  if (!isPasswordValid) {
    await handleFailedLogin(user.id, normalizedEmail, ipAddress, userAgent);
    return { success: false, message: "Invalid email or password" };
  }

  // Reset failed attempts on successful login
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  await logLoginAttempt(normalizedEmail, ipAddress, true, userAgent);

  // Generate tokens
  const accessToken = generateLoginToken({ id: user.id, email: user.email });
  const refreshToken = generateRefreshToken(user.id);

  // Build response with role-specific data
  const responseData: LoginResponse["data"] = {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };

  // Add student profile data if STUDENT role
  if (user.role === UserRoles.STUDENT) {
    const student = await prisma.student.findFirst({
      where: { userId: user.id, isDeleted: false },
      include: { batch: true },
    });

    // Fallback to email lookup for backward compatibility
    const studentByEmail = student || await prisma.student.findFirst({
      where: { email: normalizedEmail, isDeleted: false },
      include: { batch: true },
    });

    if (studentByEmail) {
      responseData.student = {
        id: studentByEmail.id,
        fullname: studentByEmail.fullname,
        batchId: studentByEmail.batchId,
        batchName: studentByEmail.batch?.name || null,
      };
    }
  }

  return {
    success: true,
    message: "Login successful",
    data: responseData,
  };
};

/**
 * Logout and blacklist token
 */
export const logout = async (
  token: string,
  userId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const decoded = verifyToken(token);
    const expiresAt = new Date((decoded.exp as number) * 1000);

    await prisma.tokenBlacklist.create({
      data: {
        token,
        userId,
        expiresAt,
        reason: "logout",
      },
    });

    return { success: true, message: "Logged out successfully" };
  } catch (error) {
    log("error", "app.auth.create failed", { err: error instanceof Error ? error.message : String(error) });
    logger.error("Logout error:", error);
    return { success: true, message: "Logged out successfully" };
  }
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const blacklisted = await prisma.tokenBlacklist.findUnique({
    where: { token },
  });
  return !!blacklisted;
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ success: boolean; message: string; accessToken?: string }> => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      config.JWT.SECRET
    ) as jwt.JwtPayload;

    if (decoded.type !== "refresh") {
      return { success: false, message: "Invalid refresh token" };
    }

    // Check if refresh token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      return { success: false, message: "Token has been revoked" };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const accessToken = generateLoginToken({ id: user.id, email: user.email });

    return { success: true, message: "Token refreshed", accessToken };
  } catch (error) {
    log("error", "app.auth.generateLoginToken failed", { err: error instanceof Error ? error.message : String(error) });
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, message: "Refresh token has expired" };
    }
    return { success: false, message: "Invalid refresh token" };
  }
};

/**
 * Request password reset (sends OTP)
 * Supports both STUDENT and TEACHER roles
 */
export const forgotPassword = async (
  email: string,
  ipAddress: string
): Promise<{ success: boolean; message: string }> => {
  const normalizedEmail = email.toLowerCase();

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Always return success to prevent email enumeration
  if (!user || (user.role !== UserRoles.STUDENT && user.role !== UserRoles.TEACHER)) {
    logger.info(`Password reset requested for non-existent email: ${normalizedEmail}`);
    return {
      success: true,
      message: "If your email is registered, you will receive an OTP shortly.",
    };
  }

  // Check if password is set (user must have a password to reset it)
  if (!user.isPasswordSet || !user.password) {
    logger.info(`Password reset requested for user without password: ${normalizedEmail}`);
    return {
      success: true,
      message: "If your email is registered, you will receive an OTP shortly.",
    };
  }

  // Generate OTP and hash it
  const otp = generateOTP();
  const hashedOTP = hashOTP(otp);
  const expiresAt = new Date(Date.now() + config.OTP.EXPIRY_MINUTES * 60 * 1000);

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  // Store hashed OTP
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: hashedOTP,
      expiresAt,
    },
  });

  // Send email
  const emailSent = await sendPasswordResetEmail(
    normalizedEmail,
    otp,
    user.name
  );

  if (!emailSent) {
    logger.error(`Failed to send password reset email to ${normalizedEmail}`);
  }

  return {
    success: true,
    message: "If your email is registered, you will receive an OTP shortly.",
  };
};

/**
 * Verify OTP and return reset token
 */
export const verifyPasswordResetOTP = async (
  email: string,
  otp: string,
  ipAddress: string,
  userAgent?: string
): Promise<VerifyOTPResponse> => {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    await logLoginAttempt(normalizedEmail, ipAddress, false, userAgent);
    return { success: false, message: "Invalid OTP" };
  }

  // Find the password reset token
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!resetToken) {
    await logLoginAttempt(normalizedEmail, ipAddress, false, userAgent);
    return { success: false, message: "OTP has expired or is invalid" };
  }

  // Verify OTP
  const isValid = verifyOTP(otp, resetToken.token);

  if (!isValid) {
    await logLoginAttempt(normalizedEmail, ipAddress, false, userAgent);
    return { success: false, message: "Invalid OTP" };
  }

  // Generate secure reset token
  const secureResetToken = generateSecureToken();
  const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Update token with secure reset token
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: {
      token: secureResetToken,
      expiresAt: newExpiresAt,
    },
  });

  await logLoginAttempt(normalizedEmail, ipAddress, true, userAgent);

  return {
    success: true,
    message: "OTP verified successfully",
    resetToken: secureResetToken,
  };
};

/**
 * Reset password using reset token
 */
export const resetPassword = async (
  resetToken: string,
  newPassword: string,
  ipAddress: string,
  userAgent?: string
): Promise<{ success: boolean; message: string }> => {
  // Find the reset token
  const tokenRecord = await prisma.passwordResetToken.findFirst({
    where: {
      token: resetToken,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!tokenRecord) {
    return { success: false, message: "Invalid or expired reset token" };
  }

  // Update password
  const hashedPassword = generateHash(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate all existing sessions for security
    prisma.tokenBlacklist.createMany({
      data: [],
      skipDuplicates: true,
    }),
  ]);

  await logLoginAttempt(tokenRecord.user.email, ipAddress, true, userAgent);

  return { success: true, message: "Password reset successfully" };
};

/**
 * Get current user profile
 * Supports both STUDENT and TEACHER roles
 */
export const getCurrentUser = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  // Only get student profile if user is a STUDENT
  let student = null;
  if (user.role === UserRoles.STUDENT) {
    // First try to find by userId
    student = await prisma.student.findFirst({
      where: { userId: userId, isDeleted: false },
      include: { batch: true },
    });

    // Fallback to email lookup for backward compatibility
    if (!student) {
      student = await prisma.student.findFirst({
        where: { email: user.email, isDeleted: false },
        include: { batch: true },
      });
    }
  }

  return { user, student };
};

// Helper functions

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId: number): string => {
  return jwt.sign(
    { userId, type: "refresh" },
    config.JWT.SECRET as jwt.Secret,
    { expiresIn: config.JWT.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
};

/**
 * Handle failed login attempt
 */
const handleFailedLogin = async (
  userId: number,
  email: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> => {
  const { MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MINUTES } = config.ACCOUNT_LOCKOUT;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
  });

  if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil },
    });
    logger.warn(`Account locked for ${email} due to too many failed attempts`);
  }

  await logLoginAttempt(email, ipAddress, false, userAgent);
};

/**
 * Log login attempt for audit
 */
const logLoginAttempt = async (
  email: string,
  ipAddress: string,
  success: boolean,
  userAgent?: string
): Promise<void> => {
  try {
    await prisma.loginAttempt.create({
      data: {
        email,
        ipAddress,
        success,
        userAgent,
      },
    });
  } catch (error) {
    log("error", "app.auth.create failed", { err: error instanceof Error ? error.message : String(error) });
    logger.error("Failed to log login attempt:", error);
  }
};
