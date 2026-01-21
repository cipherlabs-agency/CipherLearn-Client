import { prisma } from "../../../config/db.config";
import { AnnouncementPriority } from "../../../../prisma/generated/prisma/enums";

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
    return announcement;
  }

  async delete(id: number) {
    await prisma.announcement.delete({
      where: { id },
    });
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
