import { Prisma } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import type {
  AppVideo,
  AppNote,
  AppStudyMaterial,
  AppResourceFile,
  AppResourceQuery,
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

    const where: Prisma.YoutubeVideoWhereInput = {
      batchId,
      isDeleted: false,
      visibility: { not: "PRIVATE" },
    };

    if (query?.search) {
      where.title = { contains: query.search, mode: "insensitive" };
    }

    if (query?.category) {
      where.category = query.category;
    }

    const videos = await prisma.youtubeVideo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      url: v.url,
      category: v.category,
      createdAt: v.createdAt?.toISOString() || new Date().toISOString(),
    }));
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
  }
}

export const resourcesService = new ResourcesService();
