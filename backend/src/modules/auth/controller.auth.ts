// controllers/auth.controller.ts
import { Request, Response } from "express";
import { SignupData, LoginData } from "./types.auth";
import AuthService from "./service.auth";

const authService = new AuthService();

export default class AuthController {
  async signup(req: Request, res: Response) {
    try {
      const { email, name, password } = req.body as SignupData;

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required!" });
      }

      await authService.signup({ name, email, password });

      return res.status(201).json({
        success: true,
        message: "Registration successful",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";

      if (message.toLowerCase().includes("registered")) {
        return res.status(409).json({ success: false, message });
      }

      return res.status(500).json({ success: false, message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as LoginData;

      if (!email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Email and password are required" });
      }

      const result = await authService.login({ email, password });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";

      if (message.toLowerCase().includes("credentials")) {
        return res.status(401).json({ success: false, message });
      }

      if (message.toLowerCase().includes("registered")) {
        return res.status(404).json({ success: false, message });
      }

      return res.status(500).json({ success: false, message });
    }
  }

  // optional endpoints

  async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader ? authHeader.split(" ")[1] : null;

      if (!token) {
        return res
          .status(400)
          .json({ success: false, message: "No token provided" });
      }

      await authService.logout(token);

      return res.status(200).json({ success: true, message: "Logged out" });
    } catch (error) {
      console.error("logout error:", error);
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body as { email?: string };
      if (!email)
        return res
          .status(400)
          .json({ success: false, message: "Email is required" });

      const result = await authService.forgotPassword(email);
      if (!result.ok)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      // In prod, don't return token. We return it here for dev/test convenience.
      return res.status(200).json({
        success: true,
        message: "Reset token generated",
        token: result.resetToken,
      });
    } catch (error) {
      console.error("forgotPassword controller error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to generate reset token" });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { email, newPassword } = req.body as {
        email?: string;
        newPassword?: string;
      };
      if (!email || !newPassword)
        return res.status(400).json({
          success: false,
          message: "Email & newPassword are required",
        });

      const ok = await authService.resetPassword(email, newPassword);
      if (!ok)
        return res
          .status(404)
          .json({ success: false, message: "User not found or reset failed" });

      return res
        .status(200)
        .json({ success: true, message: "Password reset successful" });
    } catch (error) {
      console.error("resetPassword controller error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Password reset failed" });
    }
  }
}
