import { Request, Response } from "express";
import { notificationService } from "../../dashboard/notifications/service";
import { prisma } from "../../../config/db.config";
import logger from "../../../utils/logger";

/**
 * App notifications-ext controller — unread count (any app user) and an
 * ADMIN broadcast that writes in-app notifications + best-effort push.
 */
export class AppNotificationsExtController {
  // GET /app/notifications/unread-count
  async getUnreadCount(req: Request, res: Response) {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);
      return res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      logger.error("AppNotificationsExt.getUnreadCount error:", error);
      return res.status(500).json({ success: false, message: "Failed to load unread count" });
    }
  }

  // POST /app/notifications/broadcast  (admin)
  // Body: { title, message, targetBatchIds?: number[], link? }
  async broadcast(req: Request, res: Response) {
    try {
      const { title, message, targetBatchIds, link } = req.body || {};
      if (!title || !message) {
        return res.status(400).json({ success: false, message: "title and message are required" });
      }
      const batchIds: number[] | undefined = Array.isArray(targetBatchIds) && targetBatchIds.length
        ? targetBatchIds.map(Number)
        : undefined;

      // Resolve target student user ids for in-app notification rows
      const students = await prisma.student.findMany({
        where: {
          isDeleted: false,
          userId: { not: null },
          ...(batchIds ? { batchId: { in: batchIds } } : {}),
        },
        select: { userId: true },
      });
      const userIds = students.map((s) => s.userId).filter((id): id is number => id != null);

      if (userIds.length) {
        await notificationService.createForMultipleUsers({ userIds, title, message, link });
      }

      // Best-effort push (do not fail the request if push is unavailable)
      try {
        const push = await import("../../../utils/pushNotifications");
        if (batchIds) {
          await Promise.all(
            batchIds.map((bid) => (push.sendToBatchStudents as any)(bid, "schoolAnnouncements", title, message, link ? { link } : undefined))
          );
        } else {
          await (push.sendToAllActiveStudents as any)("schoolAnnouncements", title, message, link ? { link } : undefined);
        }
      } catch (pushErr) {
        logger.error("AppNotificationsExt.broadcast push error:", pushErr);
      }

      return res.status(200).json({ success: true, data: { recipients: userIds.length } });
    } catch (error) {
      logger.error("AppNotificationsExt.broadcast error:", error);
      return res.status(500).json({ success: false, message: "Failed to broadcast notification" });
    }
  }
}

export const appNotificationsExtController = new AppNotificationsExtController();
