import { prisma } from "../../../config/db.config";
import { AnnouncementPriority } from "../../../../prisma/generated/prisma/enums";
import { invalidateAfterAnnouncementMutation } from "../../../cache/invalidation";
import { sendToAllActiveStudents } from "../../../utils/pushNotifications";
import logger from "../../../utils/logger";

export interface CreateAnnouncementInput {
  title: string;
  description: string;
  imageUrl?: string;
  date?: Date | string;
  priority?: AnnouncementPriority;
  createdBy: string;
}

export interface UpdateAnnouncementInput {
  title?: string;
  description?: string;
  imageUrl?: string;
  date?: Date | string;
  priority?: AnnouncementPriority;
  isActive?: boolean;
}

export interface GetAnnouncementsQuery {
  page?: number;
  limit?: number;
  priority?: AnnouncementPriority;
  isActive?: boolean;
}

export class AnnouncementService {
  async create(data: CreateAnnouncementInput) {
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        date: data.date ? new Date(data.date) : null,
        priority: data.priority || AnnouncementPriority.NORMAL,
        createdBy: data.createdBy,
      },
    });
    invalidateAfterAnnouncementMutation();

    // 1. Generate in-app database notifications for all active students
    try {
      const allActiveStudents = await prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true },
      });

      if (allActiveStudents.length > 0) {
        // truncate description to 100 chars for notification body
        const shortDesc = data.description.length > 100 
          ? data.description.substring(0, 97) + "..."
          : data.description;

        await prisma.notification.createMany({
          data: allActiveStudents.map(student => ({
            userId: student.id,
            title: `New Announcement: ${announcement.title}`,
            message: shortDesc,
            type: "INFO",
            link: "/announcements",
          }))
        });
      }
    } catch (error) {
      logger.error("Failed to generate in-app notifications for announcement:", error);
    }

    // 2. Notify all active students (fire-and-forget push)
    sendToAllActiveStudents(
      "schoolAnnouncements",
      announcement.title,
      announcement.description,
      { type: "announcement", announcementId: announcement.id }
    ).catch(() => {});

    return announcement;
  }

  async getAll(query: GetAnnouncementsQuery) {
    const { page = 1, limit = 10, priority, isActive } = query;
    const skip = (page - 1) * limit;

    const where: {
      priority?: AnnouncementPriority;
      isActive?: boolean;
    } = {};

    if (priority) where.priority = priority;
    if (isActive !== undefined) where.isActive = isActive;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      }),
      prisma.announcement.count({ where }),
    ]);

    return {
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });
    return announcement;
  }

  async update(id: number, data: UpdateAnnouncementInput) {
    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        date: data.date ? new Date(data.date) : undefined,
        priority: data.priority,
        isActive: data.isActive,
      },
    });
    invalidateAfterAnnouncementMutation();
    return announcement;
  }

  async delete(id: number) {
    await prisma.announcement.delete({
      where: { id },
    });
    invalidateAfterAnnouncementMutation();
    return { success: true };
  }

  async getActiveAnnouncements() {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 10,
    });
    return announcements;
  }
}

export const announcementService = new AnnouncementService();
