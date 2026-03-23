import type { Request, Response } from "express";
import { notificationsService } from "./service";
import logger from "../../../utils/logger";
import type { UpdateNotificationPreferencesInput, RegisterDeviceInput } from "./types";
import { log } from "../../../utils/logtail";
import { prisma } from "../../../config/db.config";

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
      // Teachers don't have a NotificationPreference record (schema is student-only)
      // Return sensible defaults so the UI doesn't break for teachers
      if (!student) {
        const defaults = await notificationsService.getPreferences(-1).catch(() => null);
        return res.status(200).json({ success: true, data: defaults });
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
      // Teachers: preferences aren't persisted (NotificationPreference is student-only in schema)
      // Return success silently so the UI save action doesn't fail
      if (!student) {
        return res.status(200).json({ success: true, message: "Preferences saved" });
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
   * List in-app notifications for the current user
   * GET /app/notifications?page=&limit=&unreadOnly=
   */
  async getNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Number(req.query.limit) || 20);
      const unreadOnly = req.query.unreadOnly === "true";

      const where = { userId: user.id, ...(unreadOnly ? { isRead: false } : {}) };

      const [notifications, total, unreadCount] = await Promise.all([
        (prisma as any).notification.findMany({
          where,
          orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        (prisma as any).notification.count({ where }),
        (prisma as any).notification.count({ where: { userId: user.id, isRead: false } }),
      ]);

      return res.status(200).json({
        success: true,
        data: notifications,
        unreadCount,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      log("error", "app.notifications.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("NotificationsController.getNotifications error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
  }

  /**
   * Mark a single notification as read
   * PUT /app/notifications/:id/read
   */
  async markNotificationRead(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid notification ID" });

      await (prisma as any).notification.updateMany({
        where: { id, userId: user.id },
        data: { isRead: true },
      });

      return res.status(200).json({ success: true, message: "Marked as read" });
    } catch (error) {
      log("error", "app.notifications.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("NotificationsController.markNotificationRead error:", error);
      return res.status(500).json({ success: false, message: "Failed to mark notification" });
    }
  }

  /**
   * Mark all notifications as read
   * PUT /app/notifications/read-all
   */
  async markAllRead(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

      await (prisma as any).notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });

      return res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      log("error", "app.notifications.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("NotificationsController.markAllRead error:", error);
      return res.status(500).json({ success: false, message: "Failed to mark all notifications" });
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
