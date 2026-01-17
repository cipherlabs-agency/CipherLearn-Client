// services/auth.service.ts
import { UserRoles } from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../config/db.config";
import { LoginData, LoginResult, SignupData } from "./types.auth";
import {
  checkAdminEmail,
  compareHash,
  generateHash,
  generateLoginToken,
} from "./utils.auth";

export default class AuthService {
  async signup(data: SignupData): Promise<boolean> {
    try {
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
          role: checkAdminEmail(data.email)
            ? UserRoles.ADMIN
            : UserRoles.TEACHER,
        },
      });

      if (!user) {
        throw new Error("Failed to create user");
      }

      return true;
    } catch (error) {
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
          role: true,
        },
      });

      if (!user) {
        throw new Error("Email not registered");
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
      const message = error instanceof Error ? error.message : "Login failed";
      throw new Error(message);
    }
  }

  async logout(token: string): Promise<void> {
    try {
      return;
    } catch (error) {
      console.error("Logout failed:", error);
      return;
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
        data: { password: hashed },
      });

      return true;
    } catch (error) {
      console.error("resetPassword error:", error);
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
      throw error;
    }
  }

  async forgotPassword(
    email: string
  ): Promise<{ ok: boolean; resetToken?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true },
      });

      if (!user) return { ok: false };

      const token = generateLoginToken({ id: user.id, email: user.email });

      console.log(
        `Password reset token for ${email}: ${token} (send via email)`
      );

      return { ok: true, resetToken: token };
    } catch (error) {
      console.error("forgotPassword error:", error);
      return { ok: false };
    }
  }
}
