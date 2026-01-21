import { prisma } from "../../../config/db.config";
import type { AppVideo, AppNote, AppStudyMaterial } from "./types";

class ResourcesService {
  /**
   * Get videos for student's batch
   */
  async getVideos(batchId: number | null, limit?: number): Promise<AppVideo[]> {
    if (!batchId) return [];

    const videos = await prisma.youtubeVideo.findMany({
      where: {
        batchId,
        isDeleted: false,
        visibility: { not: "PRIVATE" },
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
      createdAt: v.createdAt?.toISOString() || new Date().toISOString(),
    }));
  }

  /**
   * Get notes for student's batch
   */
  async getNotes(batchId: number | null, limit?: number): Promise<AppNote[]> {
    if (!batchId) return [];

    const notes = await prisma.note.findMany({
      where: {
        batchId,
        isDeleted: false,
      },
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
   * Get study materials for student's batch
   */
  async getStudyMaterials(
    batchId: number | null,
    limit?: number
  ): Promise<AppStudyMaterial[]> {
    if (!batchId) return [];

    const materials = await prisma.studyMaterial.findMany({
      where: {
        batchId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return materials.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      files: m.files,
      category: m.category,
      createdAt: m.createdAt.toISOString(),
    }));
  }
}

export const resourcesService = new ResourcesService();
