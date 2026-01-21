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
  CheckEnrollmentResponse,
  LoginResponse,
  VerifyOTPResponse,
} from "./types";

/**
 * Check if email is enrolled as a student
 */
export const checkEnrollment = async (
  email: string
): Promise<CheckEnrollmentResponse> => {
  const student = await prisma.student.findFirst({
    where: { email: email.toLowerCase(), isDeleted: false },
  });

  if (!student) {
    return {
      success: true,
      isEnrolled: false,
      hasAccount: false,
      message: "Email is not enrolled in our system",
    };
  }

  // Check if user account already exists
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  return {
    success: true,
    isEnrolled: true,
    hasAccount: !!user,
    studentName: student.fullname,
    message: user
      ? "Student account exists. Please login."
      : "Student is enrolled. Please setup your password.",
  };
};

/**
 * Setup password for first-time student
 */
export const setupPassword = async (
  email: string,
  password: string,
  ipAddress: string,
  userAgent?: string
): Promise<{ success: boolean; message: string }> => {
  const normalizedEmail = email.toLowerCase();

  // Check if student is enrolled
  const student = await prisma.student.findFirst({
    where: { email: normalizedEmail, isDeleted: false },
  });

  if (!student) {
    await logLoginAttempt(normalizedEmail, ipAddress, false, userAgent);
    return { success: false, message: "Email is not enrolled in our system" };
  }

  // Check if account already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return {
      success: false,
      message: "Account already exists. Please login instead.",
    };
  }

  // Create user account
  const hashedPassword = generateHash(password);

  await prisma.user.create({
    data: {
      name: student.fullname,
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRoles.STUDENT,
    },
  });

  await logLoginAttempt(normalizedEmail, ipAddress, true, userAgent);

  // Send welcome email (non-blocking)
  sendWelcomeEmail(normalizedEmail, student.fullname).catch((err) =>
    logger.error("Failed to send welcome email:", err)
  );

  return {
    success: true,
    message: "Account created successfully. You can now login.",
  };
};

/**
 * Student login
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

  // Verify password
  const isPasswordValid = compareHash(password, user.password);

  if (!isPasswordValid) {
    await handleFailedLogin(user.id, normalizedEmail, ipAddress, userAgent);
    return { success: false, message: "Invalid email or password" };
  }

  // Check if user is a student
  if (user.role !== UserRoles.STUDENT) {
    await logLoginAttempt(normalizedEmail, ipAddress, false, userAgent);
    return { success: false, message: "Access denied. Students only." };
  }

  // Find student record
  const student = await prisma.student.findFirst({
    where: { email: normalizedEmail, isDeleted: false },
    include: { batch: true },
  });

  if (!student) {
    await logLoginAttempt(normalizedEmail, ipAddress, false, userAgent);
    return { success: false, message: "Student profile not found" };
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

  return {
    success: true,
    message: "Login successful",
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      student: {
        id: student.id,
        fullname: student.fullname,
        batchId: student.batchId,
        batchName: student.batch?.name || null,
      },
    },
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
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, message: "Refresh token has expired" };
    }
    return { success: false, message: "Invalid refresh token" };
  }
};

/**
 * Request password reset (sends OTP)
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

  // Find student (for name in email)
  const student = await prisma.student.findFirst({
    where: { email: normalizedEmail, isDeleted: false },
  });

  // Always return success to prevent email enumeration
  if (!user || !student || user.role !== UserRoles.STUDENT) {
    logger.info(`Password reset requested for non-existent email: ${normalizedEmail}`);
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
    student.fullname
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

  const student = await prisma.student.findFirst({
    where: { email: user.email, isDeleted: false },
    include: { batch: true },
  });

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
    logger.error("Failed to log login attempt:", error);
  }
};
