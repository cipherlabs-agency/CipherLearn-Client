import { prisma } from "../../../config/db.config";
import { sendToAllActiveStudents } from "../../../utils/pushNotifications";
import { cacheService } from "../../../cache/index";
import { AppKeys, InvalidationPatterns } from "../../../cache/keys";
import { APP_ANNOUNCEMENT_LIST, APP_ANNOUNCEMENT_DETAIL } from "../../../cache/ttl";
import { AnnouncementCategory } from "../../../../prisma/generated/prisma/enums";
import type { Prisma } from "../../../../prisma/generated/prisma/client";
import type {
  AppAnnouncementListItem,
  AppAnnouncementDetail,
  AnnouncementAttachment,
  AnnouncementMetadata,
  GetAnnouncementsQuery,
  AnnouncementListResponse,
} from "./types";

class AnnouncementsService {
  // ─── Map Prisma record → list item ──────────────────────────────────────
  private toListItem(a: {
    id: number;
    title: string;
    description: string;
    category: AnnouncementCategory;
    priority: import("../../../../prisma/generated/prisma/enums").AnnouncementPriority;
    department: string | null;
    date: Date | null;
    attachments: unknown;
    createdAt: Date;
  }): AppAnnouncementListItem {
    const attachments = (a.attachments ?? []) as AnnouncementAttachment[];
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      priority: a.priority,
      department: a.department,
      date: a.date?.toISOString() ?? null,
      hasAttachments: Array.isArray(attachments) && attachments.length > 0,
      createdAt: a.createdAt.toISOString(),
    };
  }

  // ─── Map Prisma record → detail ─────────────────────────────────────────
  private toDetail(a: {
    id: number;
    title: string;
    description: string;
    body: string | null;
    category: AnnouncementCategory;
    priority: import("../../../../prisma/generated/prisma/enums").AnnouncementPriority;
    department: string | null;
    date: Date | null;
    imageUrl: string | null;
    attachments: unknown;
    metadata: unknown;
    createdAt: Date;
  }): AppAnnouncementDetail {
    const attachments = (a.attachments ?? []) as AnnouncementAttachment[];
    const metadata = a.metadata as AnnouncementMetadata | null;
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      body: a.body,
      category: a.category,
      priority: a.priority,
      department: a.department,
      date: a.date?.toISOString() ?? null,
      imageUrl: a.imageUrl,
      hasAttachments: Array.isArray(attachments) && attachments.length > 0,
      attachments: Array.isArray(attachments) ? attachments : [],
      metadata: metadata && typeof metadata === "object" ? metadata : null,
      createdAt: a.createdAt.toISOString(),
    };
  }

  /**
   * Get paginated list of active announcements with optional category filter + search.
   * Respects isDraft, scheduledAt, and targetBatchIds filters.
   */
  async getAnnouncements(query: GetAnnouncementsQuery & { batchId?: number }): Promise<AnnouncementListResponse> {
    const { category, search = "", page = 1, limit = 10, batchId } = query;
    const skip = (page - 1) * limit;

    const cacheKey = AppKeys.announcementList(
      category ?? "all",
      search,
      page,
      limit
    );

    const now = new Date();

    const fetcher = async () => {
      const baseWhere: Prisma.AnnouncementWhereInput = {
        isActive: true,
        isDraft: false,
        // Only show announcements that are not scheduled, or scheduled time has passed
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
      };

      if (category) {
        baseWhere.category = category;
      }

      if (search.trim()) {
        (baseWhere as any).AND = [
          {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          },
        ];
      }

      // targetBatchIds: empty array means visible to all; non-empty means only those batches
      // We show announcement if: targetBatchIds is empty OR batchId is in targetBatchIds
      // Since Prisma has_in_array support, we do this in JS post-fetch for simplicity
      const [rows, total] = await Promise.all([
        prisma.announcement.findMany({
          where: baseWhere,
          skip,
          take: limit,
          orderBy: [{ pinned: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            priority: true,
            department: true,
            date: true,
            attachments: true,
            createdAt: true,
            targetBatchIds: true,
          },
        }),
        prisma.announcement.count({ where: baseWhere }),
      ]);

      // Filter by targetBatchIds if batchId is known
      const filtered = batchId
        ? rows.filter((a) => {
            const targets = (a as any).targetBatchIds as number[];
            return !targets || targets.length === 0 || targets.includes(batchId);
          })
        : rows;

      return {
        announcements: filtered.map((a) => this.toListItem(a)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    };

    // Skip cache when search is active or batchId is set (personalized)
    if (search.trim() || batchId) return fetcher();
    return cacheService.getOrSet(cacheKey, fetcher, APP_ANNOUNCEMENT_LIST);
  }

  /**
   * Get full announcement detail by id
   */
  async getAnnouncementById(id: number): Promise<AppAnnouncementDetail | null> {
    const cacheKey = AppKeys.announcementDetail(id);

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const announcement = await prisma.announcement.findFirst({
          where: { id, isActive: true },
        });

        if (!announcement) return null;
        return this.toDetail(announcement);
      },
      APP_ANNOUNCEMENT_DETAIL
    );
  }

  /**
   * Invalidate announcement caches (called after admin creates/updates)
   */
  invalidateCache(): void {
    cacheService.delByPrefix(InvalidationPatterns.appAnnouncements);
  }

  /**
   * Teacher: create an announcement
   */
  async createTeacherAnnouncement(
    teacherId: number,
    teacherName: string,
    data: {
      title: string;
      description: string;
      body?: string;
      category: AnnouncementCategory;
      department?: string;
      attachments?: object[];
      pinned?: boolean;
      isDraft?: boolean;
      scheduledAt?: string;
      targetBatchIds?: number[];
    }
  ) {
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        body: data.body?.trim() ?? null,
        category: data.category,
        department: data.department?.trim() ?? null,
        attachments: data.attachments && data.attachments.length > 0 ? data.attachments : undefined,
        pinned: data.pinned ?? false,
        isDraft: data.isDraft ?? false,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        targetBatchIds: data.targetBatchIds ?? [],
        isActive: true,
        createdBy: teacherName,
        createdById: teacherId,
      },
    });
    this.invalidateCache();

    // Notify all active students about the new announcement (fire-and-forget)
    sendToAllActiveStudents(
      "schoolAnnouncements",
      announcement.title,
      announcement.description,
      { type: "announcement", announcementId: announcement.id }
    ).catch(() => {});

    return this.toDetail(announcement);
  }

  /**
   * Teacher: update their own announcement
   */
  async updateTeacherAnnouncement(
    announcementId: number,
    teacherId: number,
    data: {
      title?: string;
      description?: string;
      body?: string;
      category?: AnnouncementCategory;
      department?: string;
      pinned?: boolean;
      isDraft?: boolean;
      scheduledAt?: string | null;
      targetBatchIds?: number[];
    }
  ) {
    const existing = await prisma.announcement.findFirst({
      where: { id: announcementId, createdById: teacherId, isActive: true },
    });
    if (!existing) throw new Error("Announcement not found or not authored by you");

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.body !== undefined && { body: data.body?.trim() ?? null }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.department !== undefined && { department: data.department?.trim() ?? null }),
        ...(data.pinned !== undefined && { pinned: data.pinned }),
        ...(data.isDraft !== undefined && { isDraft: data.isDraft }),
        ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }),
        ...(data.targetBatchIds !== undefined && { targetBatchIds: data.targetBatchIds }),
      },
    });
    this.invalidateCache();
    return this.toDetail(updated);
  }

  /**
   * Teacher: soft-delete (deactivate) their own announcement
   */
  async deleteTeacherAnnouncement(announcementId: number, teacherId: number): Promise<void> {
    const existing = await prisma.announcement.findFirst({
      where: { id: announcementId, createdById: teacherId, isActive: true },
    });
    if (!existing) throw new Error("Announcement not found or not authored by you");

    await prisma.announcement.update({
      where: { id: announcementId },
      data: { isActive: false },
    });
    this.invalidateCache();
  }

  /**
   * Teacher: toggle pin on their own announcement
   */
  async togglePinAnnouncement(announcementId: number, teacherId: number) {
    const existing = await prisma.announcement.findFirst({
      where: { id: announcementId, createdById: teacherId, isActive: true },
    });
    if (!existing) throw new Error("Announcement not found or not authored by you");

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: { pinned: !existing.pinned },
    });
    this.invalidateCache();
    return { id: updated.id, pinned: updated.pinned };
  }
}

export const announcementsService = new AnnouncementsService();
