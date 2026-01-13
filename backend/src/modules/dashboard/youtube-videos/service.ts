import { Prisma } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import { User } from "../../auth/types.auth";
import { YoutubeVideo, UpdateYoutubeVideoInput, GetYoutubeVideosQuery } from "./types";

export default class YoutubeVideoService {
  /**
   * Upload (create) a new YouTube video
   */
  async upload(youtubeVideo: YoutubeVideo) {
    try {
      // Validate batch exists
      const batch = await prisma.batch.findUnique({
        where: { id: youtubeVideo.batchId },
      });

      if (!batch) {
        throw new Error(`Batch with ID ${youtubeVideo.batchId} not found`);
      }

      const select: Prisma.YoutubeVideoSelect = {
        id: true,
        title: true,
        url: true,
        description: true,
        visibility: true,
        category: true,
        batchId: true,
        createdAt: true,
      };

      const newYoutubeVideo = await prisma.youtubeVideo.create({
        data: youtubeVideo,
        select: select,
      });
      return newYoutubeVideo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all videos with filtering, pagination, and search
   */
  async getAll(query: GetYoutubeVideosQuery = {}) {
    try {
      const {
        batchId,
        category,
        visibility,
        page = 1,
        limit = 10,
        search,
      } = query;

      const where: Prisma.YoutubeVideoWhereInput = {
        isDeleted: false,
      };

      if (batchId) {
        where.batchId = batchId;
      }

      if (category) {
        where.category = category;
      }

      if (visibility) {
        where.visibility = visibility;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const select: Prisma.YoutubeVideoSelect = {
        id: true,
        title: true,
        url: true,
        description: true,
        visibility: true,
        category: true,
        batchId: true,
        createdAt: true,
        updatedAt: true,
      };

      // Get total count for pagination
      const total = await prisma.youtubeVideo.count({ where });

      const youtubeVideos = await prisma.youtubeVideo.findMany({
        where,
        select,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        videos: youtubeVideos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get videos for a specific batch
   */
  async getByBatch(batchId: number) {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        throw new Error("Batch not found");
      }

      const select: Prisma.YoutubeVideoSelect = {
        id: true,
        title: true,
        url: true,
        description: true,
        visibility: true,
        category: true,
        batchId: true,
        createdAt: true,
      };

      const youtubeVideos = await prisma.youtubeVideo.findMany({
        where: { isDeleted: false, batchId: batchId },
        select: select,
        orderBy: { createdAt: "desc" },
      });

      return youtubeVideos;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single video by ID
   */
  async getById(id: number) {
    try {
      const video = await prisma.youtubeVideo.findUnique({
        where: { id, isDeleted: false },
      });

      if (!video) {
        throw new Error("Video not found");
      }

      return video;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a video
   */
  async update(id: number, data: UpdateYoutubeVideoInput) {
    try {
      // Check if video exists
      const existingVideo = await this.getById(id);

      // If changing batch, validate new batch exists
      if (data.batchId && data.batchId !== existingVideo.batchId) {
        const batch = await prisma.batch.findUnique({
          where: { id: data.batchId },
        });

        if (!batch) {
          throw new Error(`Batch with ID ${data.batchId} not found`);
        }
      }

      const updatedVideo = await prisma.youtubeVideo.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return updatedVideo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete a video (draft)
   */
  async draft(id: number, user: User) {
    try {
      const existingVideo = await prisma.youtubeVideo.findUnique({
        where: { id },
      });

      if (!existingVideo) {
        throw new Error("Youtube video not found");
      }

      const draftedYoutubeVideo = await prisma.youtubeVideo.update({
        where: { id },
        data: { isDeleted: true, deletedBy: user.name, updatedAt: new Date() },
      });
      return !!draftedYoutubeVideo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Permanently delete a video
   */
  async delete(id: number) {
    try {
      const existingVideo = await prisma.youtubeVideo.findUnique({
        where: { id },
      });

      if (!existingVideo) {
        throw new Error("Youtube video not found");
      }

      await prisma.youtubeVideo.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restore a soft-deleted video
   */
  async restore(id: number) {
    try {
      const existingVideo = await prisma.youtubeVideo.findUnique({
        where: { id },
      });

      if (!existingVideo) {
        throw new Error("Youtube video not found");
      }

      if (!existingVideo.isDeleted) {
        throw new Error("Video is not deleted");
      }

      const restoredVideo = await prisma.youtubeVideo.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedBy: null,
          updatedAt: new Date(),
        },
      });

      return restoredVideo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get video categories for a batch
   */
  async getCategories(batchId?: number) {
    try {
      const where: Prisma.YoutubeVideoWhereInput = { isDeleted: false };
      if (batchId) {
        where.batchId = batchId;
      }

      const videos = await prisma.youtubeVideo.findMany({
        where,
        select: { category: true },
        distinct: ["category"],
      });

      return videos.map((v) => v.category).filter(Boolean);
    } catch (error) {
      throw error;
    }
  }
}
