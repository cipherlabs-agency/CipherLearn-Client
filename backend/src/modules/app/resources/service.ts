import { Prisma } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import { cacheService } from "../../../cache/index";
import { AppKeys, InvalidationPatterns } from "../../../cache/keys";
import { APP_VIDEOS, APP_NOTES, APP_MATERIALS, APP_STARRED_RESOURCES } from "../../../cache/ttl";
import type {
  AppVideo,
  AppNote,
  AppStudyMaterial,
  AppResourceFile,
  AppResourceQuery,
  TeacherMaterialListItem,
  CreateMaterialInput,
  UpdateMaterialInput,
  GetTeacherMaterialsQuery,
  StarResourceType,
  StarredResourcesResponse,
} from "./types";

class ResourcesService {
  /**
   * Get videos for student's batch with optional search/category filters
   */
  async getVideos(
    batchId: number | null,
    limit?: number,
    query?: AppResourceQuery
  ): Promise<AppVideo[]> {
    if (!batchId) return [];

    const isFiltered = !!(query?.search || query?.category);

    const fetcher = async (): Promise<AppVideo[]> => {
      const now = new Date();
      // Student can see: videos for their batch, OR videos where visibleBatchIds contains their batch
      const videos = await prisma.youtubeVideo.findMany({
        where: {
          isDeleted: false,
          visibility: { not: "PRIVATE" },
          // Hide scheduled videos not yet due
          OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
          AND: [
            {
              OR: [
                { batchId },
                { visibleBatchIds: { has: batchId } },
              ],
            },
            ...(query?.search ? [{ title: { contains: query.search, mode: "insensitive" as const } }] : []),
            ...(query?.category ? [{ category: query.category }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return videos.map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        url: v.url,
        category: v.category,
        subject: (v as any).subject ?? null,
        createdAt: v.createdAt?.toISOString() || new Date().toISOString(),
      }));
    };

    // Only cache unfiltered requests
    if (isFiltered) return fetcher();
    return cacheService.getOrSet(AppKeys.videos(batchId, limit), fetcher, APP_VIDEOS);
  }

  /**
   * Get notes for student's batch with optional search/category filters
   */
  async getNotes(
    batchId: number | null,
    limit?: number,
    query?: AppResourceQuery
  ): Promise<AppNote[]> {
    if (!batchId) return [];

    const isFiltered = !!(query?.search || query?.category);

    const fetcher = async (): Promise<AppNote[]> => {
      const where: Prisma.NoteWhereInput = {
        batchId,
        isDeleted: false,
      };

      if (query?.search) {
        where.title = { contains: query.search, mode: "insensitive" };
      }

      if (query?.category) {
        where.category = query.category;
      }

      const notes = await prisma.note.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        createdAt: n.createdAt?.toISOString() || new Date().toISOString(),
      }));
    };

    // Only cache unfiltered requests
    if (isFiltered) return fetcher();
    return cacheService.getOrSet(AppKeys.notes(batchId, limit), fetcher, APP_NOTES);
  }

  /**
   * Get study materials for student's batch with optional search/category filters
   */
  async getStudyMaterials(
    batchId: number | null,
    limit?: number,
    query?: AppResourceQuery
  ): Promise<AppStudyMaterial[]> {
    if (!batchId) return [];

    const isFiltered = !!(query?.search || query?.category);

    const fetcher = async (): Promise<AppStudyMaterial[]> => {
      const where: Prisma.StudyMaterialWhereInput = {
        batchId,
        isDeleted: false,
      };

      if (query?.search) {
        where.title = { contains: query.search, mode: "insensitive" };
      }

      if (query?.category) {
        where.category = query.category;
      }

      const materials = await prisma.studyMaterial.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        files: (m.files as unknown as AppResourceFile[]) || [],
        category: m.category,
        createdAt: m.createdAt.toISOString(),
      }));
    };

    // Only cache unfiltered requests
    if (isFiltered) return fetcher();
    return cacheService.getOrSet(AppKeys.materials(batchId, limit), fetcher, APP_MATERIALS);
  }

  // ==================== TEACHER METHODS ====================

  /**
   * Get teacher's own study materials with tab filtering.
   * Tabs: published | drafts | scheduled
   */
  async getTeacherMaterials(
    teacherId: number,
    query: GetTeacherMaterialsQuery
  ): Promise<{ materials: TeacherMaterialListItem[]; pagination: object }> {
    const { tab = "published", subject, batchId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.StudyMaterialWhereInput = {
      teacherId,
      isDeleted: false,
    };

    if (batchId) where.batchId = batchId;
    if (subject) where.subject = { contains: subject, mode: "insensitive" };

    if (tab === "published") {
      where.materialStatus = "PUBLISHED";
    } else if (tab === "drafts") {
      where.materialStatus = "DRAFT";
    } else if (tab === "scheduled") {
      where.materialStatus = "SCHEDULED";
      where.scheduledAt = { gt: now };
    }

    const [materials, total] = await Promise.all([
      prisma.studyMaterial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { batch: { select: { id: true, name: true } } },
      }),
      prisma.studyMaterial.count({ where }),
    ]);

    const items: TeacherMaterialListItem[] = materials.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      subject: m.subject,
      chapter: m.chapter,
      materialType: m.materialType,
      materialStatus: m.materialStatus,
      scheduledAt: m.scheduledAt?.toISOString() ?? null,
      files: (m.files as unknown as AppResourceFile[]) || [],
      batchId: m.batchId,
      batchName: m.batch.name,
      visibleBatchIds: m.visibleBatchIds,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      materials: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Upload a new study material (files already uploaded to Cloudinary by controller).
   */
  async createTeacherMaterial(
    teacherId: number,
    teacherName: string,
    input: CreateMaterialInput,
    files: AppResourceFile[]
  ): Promise<TeacherMaterialListItem> {
    if (files.length === 0) {
      throw new Error("At least one file must be uploaded");
    }

    const material = await prisma.studyMaterial.create({
      data: {
        title: input.title.trim(),
        description: input.description?.trim() ?? null,
        subject: input.subject?.trim() ?? null,
        chapter: input.chapter?.trim() ?? null,
        materialType: (input.materialType as Prisma.StudyMaterialCreateInput["materialType"]) ?? "DOCUMENT",
        materialStatus: (input.materialStatus as Prisma.StudyMaterialCreateInput["materialStatus"]) ?? "PUBLISHED",
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        files: files as unknown as Prisma.InputJsonValue,
        batchId: input.batchId,
        teacherId,
        visibleBatchIds: input.visibleBatchIds ?? [],
        folderId: input.folderId ?? null,
        createdBy: teacherName,
      },
      include: { batch: { select: { id: true, name: true } } },
    });

    // Invalidate student material cache for affected batches
    cacheService.delByPrefix(InvalidationPatterns.appResources);

    return {
      id: material.id,
      title: material.title,
      description: material.description,
      subject: material.subject,
      chapter: material.chapter,
      materialType: material.materialType,
      materialStatus: material.materialStatus,
      scheduledAt: material.scheduledAt?.toISOString() ?? null,
      files,
      batchId: material.batchId,
      batchName: material.batch.name,
      visibleBatchIds: material.visibleBatchIds,
      folderId: material.folderId ?? null,
      createdAt: material.createdAt.toISOString(),
    };
  }

  /**
   * Update a study material (teacher must own it).
   */
  async updateTeacherMaterial(
    materialId: number,
    teacherId: number,
    input: UpdateMaterialInput
  ): Promise<TeacherMaterialListItem> {
    const existing = await prisma.studyMaterial.findFirst({
      where: { id: materialId, teacherId, isDeleted: false },
    });

    if (!existing) {
      throw new Error("Material not found or access denied");
    }

    const material = await prisma.studyMaterial.update({
      where: { id: materialId },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.description !== undefined && {
          description: input.description?.trim() ?? null,
        }),
        ...(input.subject !== undefined && { subject: input.subject?.trim() ?? null }),
        ...(input.chapter !== undefined && { chapter: input.chapter?.trim() ?? null }),
        ...(input.materialType !== undefined && {
          materialType: input.materialType as Prisma.StudyMaterialUpdateInput["materialType"],
        }),
        ...(input.materialStatus !== undefined && {
          materialStatus: input.materialStatus as Prisma.StudyMaterialUpdateInput["materialStatus"],
        }),
        ...(input.scheduledAt !== undefined && {
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        }),
        ...(input.visibleBatchIds !== undefined && {
          visibleBatchIds: input.visibleBatchIds,
        }),
        ...(input.folderId !== undefined && { folderId: input.folderId }),
      },
      include: { batch: { select: { id: true, name: true } } },
    });

    cacheService.delByPrefix(InvalidationPatterns.appResources);

    return {
      id: material.id,
      title: material.title,
      description: material.description,
      subject: material.subject,
      chapter: material.chapter,
      materialType: material.materialType,
      materialStatus: material.materialStatus,
      scheduledAt: material.scheduledAt?.toISOString() ?? null,
      files: (material.files as unknown as AppResourceFile[]) || [],
      batchId: material.batchId,
      batchName: material.batch.name,
      visibleBatchIds: material.visibleBatchIds,
      folderId: material.folderId ?? null,
      createdAt: material.createdAt.toISOString(),
    };
  }

  /**
   * Soft-delete a study material (teacher must own it).
   */
  async deleteTeacherMaterial(
    materialId: number,
    teacherId: number,
    teacherName: string
  ): Promise<void> {
    const existing = await prisma.studyMaterial.findFirst({
      where: { id: materialId, teacherId, isDeleted: false },
    });

    if (!existing) {
      throw new Error("Material not found or access denied");
    }

    await prisma.studyMaterial.update({
      where: { id: materialId },
      data: { isDeleted: true, deletedBy: teacherName },
    });

    cacheService.delByPrefix(InvalidationPatterns.appResources);
  }

  // ==================== STARRED RESOURCES ====================

  /**
   * Star a resource (note | study_material | video).
   * Idempotent — starring an already-starred resource is a no-op.
   */
  async starResource(
    studentId: number,
    resourceType: StarResourceType,
    resourceId: number
  ): Promise<void> {
    await prisma.resourceStar.upsert({
      where: {
        studentId_resourceType_resourceId: { studentId, resourceType, resourceId },
      },
      create: { studentId, resourceType, resourceId },
      update: {},
    });
    cacheService.delByPrefix(`app:starred:${studentId}`);
  }

  /**
   * Unstar a resource. Silently succeeds if the star doesn't exist.
   */
  async unstarResource(
    studentId: number,
    resourceType: StarResourceType,
    resourceId: number
  ): Promise<void> {
    await prisma.resourceStar.deleteMany({
      where: { studentId, resourceType, resourceId },
    });
    cacheService.delByPrefix(`app:starred:${studentId}`);
  }

  /**
   * Get all starred resources for a student, grouped by type.
   * Returns the full resource objects (note / study material / video).
   */
  async getStarredResources(
    studentId: number,
    batchId: number | null
  ): Promise<StarredResourcesResponse> {
    const cacheKey = AppKeys.starredResources(studentId);

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const stars = await prisma.resourceStar.findMany({
          where: { studentId },
          orderBy: { createdAt: "desc" },
        });

        const noteIds = stars.filter((s) => s.resourceType === "note").map((s) => s.resourceId);
        const materialIds = stars.filter((s) => s.resourceType === "study_material").map((s) => s.resourceId);
        const videoIds = stars.filter((s) => s.resourceType === "video").map((s) => s.resourceId);

        const [rawNotes, rawMaterials, rawVideos] = await Promise.all([
          noteIds.length > 0
            ? prisma.note.findMany({
                where: { id: { in: noteIds }, isDeleted: false, ...(batchId ? { batchId } : {}) },
              })
            : Promise.resolve([]),
          materialIds.length > 0
            ? prisma.studyMaterial.findMany({
                where: { id: { in: materialIds }, isDeleted: false, materialStatus: "PUBLISHED", ...(batchId ? { batchId } : {}) },
              })
            : Promise.resolve([]),
          videoIds.length > 0
            ? prisma.youtubeVideo.findMany({
                where: { id: { in: videoIds }, isDeleted: false, ...(batchId ? { batchId } : {}) },
              })
            : Promise.resolve([]),
        ]);

        return {
          notes: rawNotes.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            category: n.category,
            createdAt: n.createdAt?.toISOString() ?? new Date().toISOString(),
          })) as AppNote[],
          studyMaterials: rawMaterials.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            files: (m.files as unknown as AppResourceFile[]) || [],
            category: m.category,
            createdAt: m.createdAt.toISOString(),
          })) as AppStudyMaterial[],
          videos: rawVideos.map((v) => ({
            id: v.id,
            title: v.title,
            description: v.description,
            url: v.url,
            category: v.category,
            createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
          })) as AppVideo[],
        };
      },
      APP_STARRED_RESOURCES
    );
  }

  /**
   * Publish a draft material.
   */
  async publishTeacherMaterial(
    materialId: number,
    teacherId: number
  ): Promise<TeacherMaterialListItem> {
    const existing = await prisma.studyMaterial.findFirst({
      where: { id: materialId, teacherId, isDeleted: false },
    });

    if (!existing) {
      throw new Error("Material not found or access denied");
    }
    if (existing.materialStatus === "PUBLISHED") {
      throw new Error("Material is already published");
    }

    return this.updateTeacherMaterial(materialId, teacherId, {
      materialStatus: "PUBLISHED",
      scheduledAt: null,
    });
  }

  // ==================== TEACHER VIDEO (YOUTUBE) MANAGEMENT ====================

  async getTeacherVideos(
    batchId: number,
    opts: { page: number; limit: number; search?: string }
  ): Promise<{ videos: AppVideo[]; total: number }> {
    const where = {
      batchId,
      isDeleted: false,
      ...(opts.search ? { title: { contains: opts.search, mode: "insensitive" as const } } : {}),
    };
    const [videos, total] = await Promise.all([
      prisma.youtubeVideo.findMany({ where, orderBy: { createdAt: "desc" }, skip: (opts.page - 1) * opts.limit, take: opts.limit }),
      prisma.youtubeVideo.count({ where }),
    ]);
    return {
      total,
      videos: videos.map((v) => ({
        id: v.id, title: v.title, description: v.description,
        url: v.url, category: v.category,
        createdAt: v.createdAt?.toISOString() || new Date().toISOString(),
      })),
    };
  }

  async createVideo(data: {
    title: string; url: string; batchId: number;
    description?: string; category?: string; subject?: string;
    publish?: boolean; visibleBatchIds?: number[]; scheduledAt?: string;
  }): Promise<AppVideo> {
    const video = await prisma.youtubeVideo.create({
      data: {
        title: data.title, url: data.url, batchId: data.batchId,
        description: data.description, category: data.category,
        subject: data.subject,
        visibility: data.publish ? "PUBLIC" : "PRIVATE",
        visibleBatchIds: data.visibleBatchIds ?? [],
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
    });
    await cacheService.delByPrefix(`app:videos:${data.batchId}`);
    return {
      id: video.id, title: video.title, description: video.description,
      url: video.url, category: video.category, subject: (video as any).subject ?? null,
      createdAt: video.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  async updateVideo(
    videoId: number, batchId: number,
    data: { title?: string; description?: string; category?: string; subject?: string; visibility?: string; visibleBatchIds?: number[]; scheduledAt?: string | null }
  ): Promise<AppVideo> {
    const existing = await prisma.youtubeVideo.findFirst({ where: { id: videoId, batchId, isDeleted: false } });
    if (!existing) throw new Error("Video not found");
    const updatePayload: Record<string, unknown> = { ...data };
    if (data.scheduledAt !== undefined) {
      updatePayload.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }
    const updated = await prisma.youtubeVideo.update({ where: { id: videoId }, data: updatePayload as any });
    await cacheService.delByPrefix(`app:videos:${batchId}`);
    return {
      id: updated.id, title: updated.title, description: updated.description,
      url: updated.url, category: updated.category, subject: (updated as any).subject ?? null,
      createdAt: updated.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  async deleteVideo(videoId: number, batchId: number, deletedByName: string): Promise<void> {
    const existing = await prisma.youtubeVideo.findFirst({ where: { id: videoId, batchId, isDeleted: false } });
    if (!existing) throw new Error("Video not found");
    await prisma.youtubeVideo.update({ where: { id: videoId }, data: { isDeleted: true, deletedBy: deletedByName } });
    await cacheService.delByPrefix(`app:videos:${batchId}`);
  }

  // ==================== MATERIAL FOLDERS ====================

  async getFolders(batchId: number): Promise<{ id: number; name: string; materialCount: number }[]> {
    const folders = await prisma.materialFolder.findMany({
      where: { batchId, isDeleted: false },
      include: { _count: { select: { materials: { where: { isDeleted: false, materialStatus: "PUBLISHED" } } } } },
      orderBy: { name: "asc" },
    });
    return folders.map((f) => ({ id: f.id, name: f.name, materialCount: f._count.materials }));
  }

  async createFolder(batchId: number, name: string, createdBy: string): Promise<{ id: number; name: string }> {
    const folder = await prisma.materialFolder.create({
      data: { batchId, name: name.trim(), createdBy },
    });
    return { id: folder.id, name: folder.name };
  }

  async updateFolder(folderId: number, batchId: number, name: string): Promise<{ id: number; name: string }> {
    const existing = await prisma.materialFolder.findFirst({ where: { id: folderId, batchId, isDeleted: false } });
    if (!existing) throw new Error("Folder not found");
    const updated = await prisma.materialFolder.update({ where: { id: folderId }, data: { name: name.trim() } });
    return { id: updated.id, name: updated.name };
  }

  async deleteFolder(folderId: number, batchId: number): Promise<void> {
    const existing = await prisma.materialFolder.findFirst({ where: { id: folderId, batchId, isDeleted: false } });
    if (!existing) throw new Error("Folder not found");
    // Move materials to no folder before deleting
    await prisma.studyMaterial.updateMany({ where: { folderId }, data: { folderId: null } });
    await prisma.materialFolder.update({ where: { id: folderId }, data: { isDeleted: true } });
  }
}

export const resourcesService = new ResourcesService();
