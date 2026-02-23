import type { Request, Response } from "express";
import { notificationsService } from "./service";
import logger from "../../../utils/logger";
import type { UpdateNotificationPreferencesInput } from "./types";

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

      // Validate that body is an object and only contains known keys
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
      logger.error("NotificationsController.updatePreferences error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save preferences";
      return res.status(400).json({
        success: false,
        message,
      });
    }
  }
}

export const notificationsController = new NotificationsController();
