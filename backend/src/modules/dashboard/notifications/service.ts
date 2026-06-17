import { prisma } from "../../../config/db.config";
import type { NotificationType } from "../../../../prisma/generated/prisma/client";
import { sseManager } from "../../../sse/manager";

export interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

export interface BulkNotificationData {
  userIds: number[];
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

export const notificationService = {
  async getByUserId(userId: number, limit = 30, unreadOnly = false) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async getUnreadCount(userId: number): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  async markAsRead(id: number, userId: number) {
    const result = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    // Emit updated unread count so the badge refreshes instantly
    const count = await this.getUnreadCount(userId);
    sseManager.emit(userId, "unread_count", { count });

    return result;
  },

  async markAllAsRead(userId: number) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    sseManager.emit(userId, "unread_count", { count: 0 });

    return result;
  },

  /** Create a single notification and push it to any connected SSE client */
  async create(data: NotificationData) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type ?? "INFO",
        link: data.link ?? null,
      },
    });

    // Push real-time — fire-and-forget (non-fatal if no client connected)
    sseManager.emit(data.userId, "notification", {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      link: notification.link,
      createdAt: notification.createdAt.toISOString(),
    });

    // Also update the unread badge count
    const count = await this.getUnreadCount(data.userId);
    sseManager.emit(data.userId, "unread_count", { count });

    return notification;
  },

  /** Create notifications for many users and push SSE to each */
  async createForMultipleUsers(data: BulkNotificationData) {
    const result = await prisma.notification.createMany({
      data: data.userIds.map((userId) => ({
        userId,
        title: data.title,
        message: data.message,
        type: data.type ?? "INFO",
        link: data.link ?? null,
      })),
    });

    // For bulk creates, emit a generic notification event so connected clients refetch
    const broadcastPayload = {
      id: -1,
      title: data.title,
      message: data.message,
      type: (data.type ?? "INFO") as string,
      isRead: false,
      link: data.link ?? null,
      createdAt: new Date().toISOString(),
    };
    sseManager.emitToMany(data.userIds, "notification", broadcastPayload);

    return result;
  },

  async deleteOld(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
  },
};
