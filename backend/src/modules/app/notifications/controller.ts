import type { Request, Response } from "express";
import { notificationsService } from "./service";
import logger from "../../../utils/logger";
import type { UpdateNotificationPreferencesInput, RegisterDeviceInput } from "./types";
import { log } from "../../../utils/logtail";

class NotificationsController {
  /**
   * Get student's notification preferences
   * GET /app/notifications/preferences
   *
   * Returns defaults if the student hasn't saved preferences yet.
   */
  async getPreferences(req: Request, res: Response): Promise<Response> {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const preferences = await notificationsService.getPreferences(student.id);

      return res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      log("error", "app.notifications.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("NotificationsController.getPreferences error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notification preferences",
      });
    }
  }

  /**
   * Save student's notification preferences
   * PUT /app/notifications/preferences
   *
   * Accepts full or partial update. Returns the complete updated preferences.
   * Body: { academicAlerts?, examsResults?, materialsUpdates?, administrative?, quietHours? }
   */
  async updatePreferences(req: Request, res: Response): Promise<Response> {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const body = req.body as UpdateNotificationPreferencesInput;

      const allowedTopKeys = new Set([
        "academicAlerts",
        "examsResults",
        "materialsUpdates",
        "administrative",
        "quietHours",
      ]);

      for (const key of Object.keys(body)) {
        if (!allowedTopKeys.has(key)) {
          return res.status(400).json({
            success: false,
            message: `Unknown preference key: "${key}"`,
          });
        }
      }

      const preferences = await notificationsService.updatePreferences(
        student.id,
        body
      );

      return res.status(200).json({
        success: true,
        message: "Notification preferences saved",
        data: preferences,
      });
    } catch (error) {
      log("error", "app.notifications.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("NotificationsController.updatePreferences error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save preferences";
      return res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Register device push token
   * POST /app/notifications/register-device
   *
   * Body: { token: string, platform?: "EXPO" | "IOS" | "ANDROID" }
   * Works for both students and teachers.
   */
  async registerDevice(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const body = req.body as RegisterDeviceInput;
      if (!body.token?.trim()) {
        return res.status(400).json({ success: false, message: "token is required" });
      }

      await notificationsService.registerDevice(user.id, body);

      return res.status(200).json({ success: true, message: "Device registered for push notifications" });
    } catch (error) {
      log("error", "app.notifications.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("NotificationsController.registerDevice error:", error);
      const message = error instanceof Error ? error.message : "Failed to register device";
      return res.status(400).json({ success: false, message });
    }
  }

  /**
   * Deregister device push token (call on logout)
   * DELETE /app/notifications/register-device
   *
   * Body: { token: string }
   */
  async deregisterDevice(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const { token } = req.body as { token: string };
      if (!token?.trim()) {
        return res.status(400).json({ success: false, message: "token is required" });
      }

      await notificationsService.deregisterDevice(user.id, token);

      return res.status(200).json({ success: true, message: "Device deregistered" });
    } catch (error) {
      log("error", "app.notifications.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("NotificationsController.deregisterDevice error:", error);
      return res.status(500).json({ success: false, message: "Failed to deregister device" });
    }
  }
}

export const notificationsController = new NotificationsController();
