// services/auth.service.ts
import { UserRoles } from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../config/db.config";
import { LoginData, LoginResult, SignupData } from "./types.auth";
import {
  checkAdminEmail,
  compareHash,
  generateHash,
  generateLoginToken,
  verifyToken,
} from "./utils.auth";
import { sendAdminPasswordResetEmail } from "../../utils/email";
import logger from "../../utils/logger";
import { log } from "../../utils/logtail";

export default class AuthService {
  async signup(data: SignupData): Promise<boolean> {
    try {
      // Only allow admin account creation through this endpoint
      // Teachers must be created via /dashboard/teachers
      if (!checkAdminEmail(data.email)) {
        throw new Error(
          "Only admin accounts can be created through this endpoint. Use the Teachers management to add teachers."
        );
      }

      const alreadyExist = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });

      if (alreadyExist) {
        throw new Error("Email already registered");
      }

      const hashPassword = generateHash(data.password);

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashPassword,
          isPasswordSet: true,
          role: UserRoles.ADMIN,
        },
      });

      if (!user) {
        throw new Error("Failed to create user");
      }

      return true;
    } catch (error) {
      log("error", "auth.Error failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Signup failed";
      throw new Error(message);
    }
  }

  async login(data: LoginData): Promise<LoginResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          isPasswordSet: true,
          role: true,
        },
      });

      if (!user) {
        throw new Error("Email not registered");
      }

      // Check password is set and the isPasswordSet flag is true
      if (!user.password || !user.isPasswordSet) {
        throw new Error("Password not set. Please set up your password first.");
      }

      const compare = compareHash(data.password, user.password);
      if (!compare) {
        throw new Error("Invalid credentials");
      }

      const payload = {
        id: user.id,
        email: user.email,
      };

      const token = generateLoginToken(payload);

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      return { user: safeUser, token };
    } catch (error) {
      log("error", "auth.generateLoginToken failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Login failed";
      throw new Error(message);
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const decoded = verifyToken(token);
      const expiresAt = new Date((decoded.exp as number) * 1000);

      await prisma.tokenBlacklist.create({
        data: {
          token,
          userId: decoded.id as number,
          expiresAt,
          reason: "logout",
        },
      });
    } catch (error) {
      log("error", "auth.create failed", { err: error instanceof Error ? error.message : String(error) });
      // Token may already be expired or invalid; still treat logout as success
      logger.warn(`Dashboard logout: could not blacklist token — ${error}`);
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) return false;

      const hashed = generateHash(newPassword);

      await prisma.user.update({
        where: { email },
        data: { password: hashed, isPasswordSet: true },
      });

      return true;
    } catch (error) {
      log("error", "auth.update failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("resetPassword error:", error);
      return false;
    }
  }

  async updateProfile(userId: number, data: { name?: string; email?: string }) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
      return user;
    } catch (error) {
      log("error", "auth.update failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<{ ok: boolean }> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true },
      });

      if (!user) return { ok: false };

      const token = generateLoginToken({ id: user.id, email: user.email });

      // Send token via email — do not return it in the HTTP response
      sendAdminPasswordResetEmail(user.email, user.name, token).catch((err) =>
        logger.error(`Failed to send admin password reset email to ${email}:`, err)
      );

      return { ok: true };
    } catch (error) {
      log("error", "auth.error failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("forgotPassword error:", error);
      return { ok: false };
    }
  }

  async checkUserStatus(email: string): Promise<{ exists: boolean; isPasswordSet: boolean }> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isPasswordSet: true },
    });

    return {
      exists: !!user,
      isPasswordSet: user?.isPasswordSet || false,
    };
  }
}
