import type { Request, Response } from "express";
import { resourcesService } from "./service";
import logger from "../../../utils/logger";
import CloudinaryService from "../../../config/cloudinairy.config";
import { validateMagicNumber } from "../../../config/multer.config";
import type { AppResourceQuery, AppResourceFile, CreateMaterialInput, UpdateMaterialInput, StarResourceType } from "./types";
import { log } from "../../../utils/logtail";

const cloudinaryService = new CloudinaryService();

class ResourcesController {
  /**
   * Parse common search/category query params
   */
  private parseResourceQuery(req: Request): AppResourceQuery {
    return {
      search: req.query.search ? String(req.query.search) : undefined,
      category: req.query.category ? String(req.query.category) : undefined,
    };
  }

  /**
   * Get videos for student's batch
   * GET /app/resources/videos
   */
  async getVideos(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const query = this.parseResourceQuery(req);
      const videos = await resourcesService.getVideos(student.batchId, limit, query);

      return res.status(200).json({
        success: true,
        data: videos,
      });
    } catch (error) {
      log("error", "app.resources.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ResourcesController.getVideos error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get videos: ${error}`,
      });
    }
  }

  /**
   * Get notes for student's batch
   * GET /app/resources/notes
   */
  async getNotes(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const query = this.parseResourceQuery(req);
      const notes = await resourcesService.getNotes(student.batchId, limit, query);

      return res.status(200).json({
        success: true,
        data: notes,
      });
    } catch (error) {
      log("error", "app.resources.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ResourcesController.getNotes error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get notes: ${error}`,
      });
    }
  }

  /**
   * Get study materials for student's batch
   * GET /app/resources/study-materials
   */
  async getStudyMaterials(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const query = this.parseResourceQuery(req);
      const materials = await resourcesService.getStudyMaterials(student.batchId, limit, query);

      return res.status(200).json({
        success: true,
        data: materials,
      });
    } catch (error) {
      log("error", "app.resources.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ResourcesController.getStudyMaterials error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get study materials: ${error}`,
      });
    }
  }

  // ==================== TEACHER ENDPOINTS ====================

  /**
   * GET /app/resources/teacher
   * Teacher: list their study materials with tab filter
   *   ?tab=published|drafts|scheduled&subject=&batchId=&page=&limit=
   */
  async getTeacherMaterials(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const tab = req.query.tab as "published" | "drafts" | "scheduled" | undefined;
      const subject = req.query.subject ? String(req.query.subject) : undefined;
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = Math.min(req.query.limit ? Number(req.query.limit) : 20, 50);

      const result = await resourcesService.getTeacherMaterials(user.id, {
        tab,
        subject,
        batchId,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        data: result.materials,
        pagination: result.pagination,
      });
    } catch (error) {
      log("error", "app.resources.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("ResourcesController.getTeacherMaterials error:", error);
      return res.status(500).json({ success: false, message: "Failed to get materials" });
    }
  }

  /**
   * POST /app/resources/teacher
   * Teacher: upload study material
   * Body (multipart/form-data):
   *   title, description?, subject?, chapter?, materialType?, materialStatus?,
   *   scheduledAt?, batchId, visibleBatchIds (JSON), files[] (100MB each, max 5)
   *
   * Rate limit: 10 uploads per 5 min
   */
  async createTeacherMaterial(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const {
        title,
        description,
        subject,
        chapter,
        materialType,
        materialStatus,
        scheduledAt,
        batchId: rawBatchId,
        visibleBatchIds: rawVisible,
        folderId: rawFolderId,
      } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ success: false, message: "Title is required" });
      }

      const batchId = Number(rawBatchId);
      if (isNaN(batchId) || batchId <= 0) {
        return res.status(400).json({ success: false, message: "Valid batchId is required" });
      }

      let visibleBatchIds: number[] = [];
      if (rawVisible) {
        try {
          const parsed =
            typeof rawVisible === "string" ? JSON.parse(rawVisible) : rawVisible;
          visibleBatchIds = Array.isArray(parsed)
            ? parsed.map(Number).filter((n) => !isNaN(n))
            : [];
        } catch {
          return res.status(400).json({
            success: false,
            message: "visibleBatchIds must be a JSON array of numbers",
          });
        }
      }

      // Upload files to Cloudinary
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one file is required",
        });
      }

      for (const file of files) {
        const isValid = validateMagicNumber(file.buffer, file.mimetype);
        if (!isValid) {
          return res.status(400).json({
            success: false,
            message: `File "${file.originalname}" failed security validation`,
          });
        }
      }

      let uploadedFiles: AppResourceFile[];
      try {
        const results = await cloudinaryService.uploadDocuments(files, "study-materials");
        uploadedFiles = results.map((r) => ({
          url: r.url,
          publicId: r.public_id,
          filename: r.original_filename,
          size: r.bytes,
        }));
      } catch (uploadError) {
        logger.error("ResourcesController.createTeacherMaterial Cloudinary error:", uploadError);
        return res.status(502).json({
          success: false,
          message: "File upload failed. Please try again.",
        });
      }

      const folderId = rawFolderId ? Number(rawFolderId) : undefined;

      const input: CreateMaterialInput = {
        title,
        description,
        subject,
        chapter,
        materialType,
        materialStatus: materialStatus === "DRAFT" ? "DRAFT" : materialStatus === "SCHEDULED" ? "SCHEDULED" : "PUBLISHED",
        scheduledAt,
        batchId,
        visibleBatchIds,
        folderId: folderId && !isNaN(folderId) ? folderId : undefined,
      };

      const material = await resourcesService.createTeacherMaterial(
        user.id,
        user.name,
        input,
        uploadedFiles
      );

        if (input.materialStatus === 'PUBLISHED') {
          // Only if it goes live immediately
          import('../../../utils/pushNotifications').then(({ sendToBatchStudents }) => {
            sendToBatchStudents(batchId, 'schoolAnnouncements', 'New Study Material: ' + title, 'New material has been uploaded for ' + subject).catch(err => logger.error('err:', err));
          });
        }

      return res.status(201).json({
        success: true,
        message: "Study material uploaded",
        data: material,
      });
    } catch (error) {
      log("error", "app.resources.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("ResourcesController.createTeacherMaterial error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to upload material";
      return res.status(400).json({ success: false, message });
    }
  }

  /**
   * PUT /app/resources/teacher/:id
   * Teacher: update material details (must own it)
   */
  async updateTeacherMaterial(req: Request, res: Response) {
    try {
      const user = req.user;
      const materialId = Number(req.params.id);

      if (!user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }
      if (isNaN(materialId)) {
        return res.status(400).json({ success: false, message: "Invalid material ID" });
      }

      const input: UpdateMaterialInput = req.body;

      const material = await resourcesService.updateTeacherMaterial(
        materialId,
        user.id,
        input
      );

      return res.status(200).json({
        success: true,
        message: "Material updated",
        data: material,
      });
    } catch (error) {
      log("error", "app.resources.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("ResourcesController.updateTeacherMaterial error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update material";
      return res.status(400).json({ success: false, message });
    }
  }

  /**
   * DELETE /app/resources/teacher/:id
   * Teacher: soft-delete material (must own it)
   */
  async deleteTeacherMaterial(req: Request, res: Response) {
    try {
      const user = req.user;
      const materialId = Number(req.params.id);

      if (!user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }
      if (isNaN(materialId)) {
        return res.status(400).json({ success: false, message: "Invalid material ID" });
      }

      await resourcesService.deleteTeacherMaterial(materialId, user.id, user.name);

      return res.status(200).json({ success: true, message: "Material deleted" });
    } catch (error) {
      log("error", "app.resources.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("ResourcesController.deleteTeacherMaterial error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to delete material";
      return res.status(400).json({ success: false, message });
    }
  }

  // ==================== TEACHER VIDEO (YOUTUBE) ====================

  /**
   * GET /app/resources/teacher/videos?batchId=&page=&limit=&search=
   * Teacher: list YouTube video lectures for a batch
   */
  async getTeacherVideos(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

      const batchId = Number(req.query.batchId);
      if (isNaN(batchId) || batchId <= 0) return res.status(400).json({ success: false, message: "Valid batchId is required" });

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Number(req.query.limit) || 20);
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = await resourcesService.getTeacherVideos(batchId, { page, limit, search });
      return res.status(200).json({ success: true, data: result.videos, pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) } });
    } catch (error) {
      logger.error("ResourcesController.getTeacherVideos error:", error);
      return res.status(500).json({ success: false, message: "Failed to get videos" });
    }
  }

  /**
   * POST /app/resources/teacher/video
   * Teacher: add a YouTube video lecture
   * Body: { url, title, batchId, description?, category?, publish?, notifyStudents? }
   */
  async createVideo(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

      const { url, title, batchId, description, category, subject, publish, notifyStudents, visibleBatchIds, scheduledAt } = req.body;

      if (!url?.trim()) return res.status(400).json({ success: false, message: "url is required" });
      if (!title?.trim()) return res.status(400).json({ success: false, message: "title is required" });
      if (!batchId) return res.status(400).json({ success: false, message: "batchId is required" });

      const video = await resourcesService.createVideo({
        url, title, batchId: Number(batchId), description, category, subject,
        publish: publish === true || publish === "true",
        visibleBatchIds: Array.isArray(visibleBatchIds) ? visibleBatchIds.map(Number) : undefined,
        scheduledAt: scheduledAt || undefined,
      });

      if ((notifyStudents === true || notifyStudents === "true") && (publish === true || publish === "true")) {
        import("../../../utils/pushNotifications").then(({ sendToBatchStudents }) => {
          sendToBatchStudents(Number(batchId), "classResourceUploaded", `New Video: ${title}`, `A new video lecture has been uploaded for your class.`).catch(() => {});
        });
      }

      return res.status(201).json({ success: true, message: "Video lecture added", data: video });
    } catch (error) {
      logger.error("ResourcesController.createVideo error:", error);
      const message = error instanceof Error ? error.message : "Failed to add video";
      return res.status(400).json({ success: false, message });
    }
  }

  /**
   * PUT /app/resources/teacher/video/:id
   * Teacher: update a YouTube video
   * Body: { title?, description?, category?, visibility? }
   */
  async updateVideo(req: Request, res: Response) {
    try {
      const user = req.user;
      const videoId = Number(req.params.id);
      const batchId = Number(req.body.batchId || req.query.batchId);

      if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
      if (isNaN(videoId)) return res.status(400).json({ success: false, message: "Invalid video ID" });
      if (isNaN(batchId)) return res.status(400).json({ success: false, message: "batchId is required" });

      const { title, description, category, subject, visibility, visibleBatchIds, scheduledAt } = req.body;
      const video = await resourcesService.updateVideo(videoId, batchId, {
        title, description, category, subject, visibility,
        visibleBatchIds: Array.isArray(visibleBatchIds) ? visibleBatchIds.map(Number) : undefined,
        scheduledAt: scheduledAt !== undefined ? scheduledAt || null : undefined,
      });

      return res.status(200).json({ success: true, message: "Video updated", data: video });
    } catch (error) {
      logger.error("ResourcesController.updateVideo error:", error);
      const message = error instanceof Error ? error.message : "Failed to update video";
      return res.status(400).json({ success: false, message });
    }
  }

  /**
   * DELETE /app/resources/teacher/video/:id
   * Teacher: soft-delete a YouTube video
   * Body or query: { batchId }
   */
  async deleteVideo(req: Request, res: Response) {
    try {
      const user = req.user;
      const videoId = Number(req.params.id);
      const batchId = Number(req.body.batchId || req.query.batchId);

      if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
      if (isNaN(videoId)) return res.status(400).json({ success: false, message: "Invalid video ID" });
      if (isNaN(batchId)) return res.status(400).json({ success: false, message: "batchId is required" });

      await resourcesService.deleteVideo(videoId, batchId, user.name);
      return res.status(200).json({ success: true, message: "Video deleted" });
    } catch (error) {
      logger.error("ResourcesController.deleteVideo error:", error);
      const message = error instanceof Error ? error.message : "Failed to delete video";
      return res.status(400).json({ success: false, message });
    }
  }

  // ==================== MATERIAL FOLDERS ====================

  /**
   * GET /app/resources/teacher/folders?batchId=
   * Teacher: list material folders for a batch
   */
  async getFolders(req: Request, res: Response) {
    try {
      const batchId = Number(req.query.batchId);
      if (isNaN(batchId)) return res.status(400).json({ success: false, message: "batchId is required" });
      const folders = await resourcesService.getFolders(batchId);
      return res.status(200).json({ success: true, data: folders });
    } catch (error) {
      logger.error("ResourcesController.getFolders error:", error);
      return res.status(500).json({ success: false, message: "Failed to get folders" });
    }
  }

  /**
   * POST /app/resources/teacher/folders
   * Teacher: create a new folder
   * Body: { batchId, name }
   */
  async createFolder(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
      const { batchId, name } = req.body;
      if (!batchId || !name?.trim()) return res.status(400).json({ success: false, message: "batchId and name are required" });
      const folder = await resourcesService.createFolder(Number(batchId), name, user.name);
      return res.status(201).json({ success: true, message: "Folder created", data: folder });
    } catch (error) {
      logger.error("ResourcesController.createFolder error:", error);
      const message = error instanceof Error ? error.message : "Failed to create folder";
      return res.status(400).json({ success: false, message });
    }
  }

  /**
   * PUT /app/resources/teacher/folder/:id
   * Teacher: rename a folder
   * Body: { batchId, name }
   */
  async updateFolder(req: Request, res: Response) {
    try {
      const folderId = Number(req.params.id);
      const { batchId, name } = req.body;
      if (isNaN(folderId)) return res.status(400).json({ success: false, message: "Invalid folder ID" });
      if (!batchId || !name?.trim()) return res.status(400).json({ success: false, message: "batchId and name are required" });
      const folder = await resourcesService.updateFolder(folderId, Number(batchId), name);
      return res.status(200).json({ success: true, message: "Folder renamed", data: folder });
    } catch (error) {
      logger.error("ResourcesController.updateFolder error:", error);
      const message = error instanceof Error ? error.message : "Failed to update folder";
      return res.status(400).json({ success: false, message });
    }
  }

  /**
   * DELETE /app/resources/teacher/folder/:id
   * Teacher: delete a folder (materials move to no-folder)
   * Body/query: { batchId }
   */
  async deleteFolder(req: Request, res: Response) {
    try {
      const folderId = Number(req.params.id);
      const batchId = Number(req.body.batchId || req.query.batchId);
      if (isNaN(folderId)) return res.status(400).json({ success: false, message: "Invalid folder ID" });
      if (isNaN(batchId)) return res.status(400).json({ success: false, message: "batchId is required" });
      await resourcesService.deleteFolder(folderId, batchId);
      return res.status(200).json({ success: true, message: "Folder deleted" });
    } catch (error) {
      logger.error("ResourcesController.deleteFolder error:", error);
      const message = error instanceof Error ? error.message : "Failed to delete folder";
      return res.status(400).json({ success: false, message });
    }
  }

  // ==================== STARRED RESOURCES ====================

  /**
   * POST /app/resources/starred
   * Student: star a resource
   * Body (JSON): { resourceType: "note"|"study_material"|"video", resourceId: number }
   */
  async starResource(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({ success: false, message: "Student not authenticated" });
      }

      const { resourceType, resourceId } = req.body;
      if (!resourceType || !resourceId) {
        return res.status(400).json({ success: false, message: "resourceType and resourceId are required" });
      }

      const validTypes: StarResourceType[] = ["note", "study_material", "video"];
      if (!validTypes.includes(resourceType)) {
        return res.status(400).json({ success: false, message: "resourceType must be note, study_material, or video" });
      }

      await resourcesService.starResource(student.id, resourceType as StarResourceType, Number(resourceId));

      return res.status(200).json({ success: true, message: "Resource starred" });
    } catch (error) {
      log("error", "app.resources.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ResourcesController.starResource error:", error);
      return res.status(500).json({ success: false, message: "Failed to star resource" });
    }
  }

  /**
   * DELETE /app/resources/starred
   * Student: unstar a resource
   * Body (JSON): { resourceType: "note"|"study_material"|"video", resourceId: number }
   */
  async unstarResource(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({ success: false, message: "Student not authenticated" });
      }

      const { resourceType, resourceId } = req.body;
      if (!resourceType || !resourceId) {
        return res.status(400).json({ success: false, message: "resourceType and resourceId are required" });
      }

      await resourcesService.unstarResource(student.id, resourceType as StarResourceType, Number(resourceId));

      return res.status(200).json({ success: true, message: "Resource unstarred" });
    } catch (error) {
      log("error", "app.resources.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ResourcesController.unstarResource error:", error);
      return res.status(500).json({ success: false, message: "Failed to unstar resource" });
    }
  }

  /**
   * GET /app/resources/starred
   * Student: get all their starred resources grouped by type
   */
  async getStarredResources(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({ success: false, message: "Student not authenticated" });
      }

      const result = await resourcesService.getStarredResources(student.id, student.batchId);

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      log("error", "app.resources.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ResourcesController.getStarredResources error:", error);
      return res.status(500).json({ success: false, message: "Failed to get starred resources" });
    }
  }

  /**
   * PUT /app/resources/teacher/:id/publish
   * Teacher: publish a draft or scheduled material
   */
  async publishTeacherMaterial(req: Request, res: Response) {
    try {
      const user = req.user;
      const materialId = Number(req.params.id);

      if (!user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }
      if (isNaN(materialId)) {
        return res.status(400).json({ success: false, message: "Invalid material ID" });
      }

      const material = await resourcesService.publishTeacherMaterial(
        materialId,
        user.id
      );

      return res.status(200).json({
        success: true,
        message: "Material published",
        data: material,
      });
    } catch (error) {
      log("error", "app.resources.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("ResourcesController.publishTeacherMaterial error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to publish material";
      return res.status(400).json({ success: false, message });
    }
  }
}

export const resourcesController = new ResourcesController();
