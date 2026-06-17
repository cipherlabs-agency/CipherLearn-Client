import { Request, Response } from "express";
import { notificationService } from "./service";
import { sseManager } from "../../../sse/manager";
import logger from "../../../utils/logger";

export const notificationController = {
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const unreadOnly = req.query.unreadOnly === "true";
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));

      const [notifications, unreadCount] = await Promise.all([
        notificationService.getByUserId(userId, limit, unreadOnly),
        notificationService.getUnreadCount(userId),
      ]);

      return res.json({ success: true, data: notifications, unreadCount });
    } catch (error) {
      logger.error("notificationController.getNotifications error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
  },

  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const count = await notificationService.getUnreadCount(userId);
      return res.json({ success: true, count });
    } catch (error) {
      logger.error("notificationController.getUnreadCount error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch unread count" });
    }
  },

  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ success: false, message: "Invalid notification ID" });
      }

      await notificationService.markAsRead(notificationId, userId);
      return res.json({ success: true, message: "Notification marked as read" });
    } catch (error) {
      logger.error("notificationController.markAsRead error:", error);
      return res.status(500).json({ success: false, message: "Failed to mark as read" });
    }
  },

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      await notificationService.markAllAsRead(userId);
      return res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      logger.error("notificationController.markAllAsRead error:", error);
      return res.status(500).json({ success: false, message: "Failed to mark all as read" });
    }
  },

  /**
   * GET /dashboard/notifications/stream
   * SSE stream — authenticated users connect once; new notifications are pushed in real-time.
   * Token is passed as ?token=<jwt> query param (EventSource doesn't support custom headers).
   */
  async stream(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
    res.flushHeaders();

    // Register this connection
    sseManager.subscribe(userId, res);

    // Send current unread count immediately on connect so badge is accurate
    const count = await notificationService.getUnreadCount(userId);
    res.write(`event: unread_count\ndata: ${JSON.stringify({ count })}\n\n`);

    // Clean up on disconnect
    req.on("close", () => {
      sseManager.unsubscribe(userId, res);
    });
  },
};
