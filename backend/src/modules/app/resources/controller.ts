import type { Request, Response } from "express";
import { resourcesService } from "./service";
import logger from "../../../utils/logger";
import type { AppResourceQuery } from "./types";

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
      logger.error("ResourcesController.getStudyMaterials error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get study materials: ${error}`,
      });
    }
  }
}

export const resourcesController = new ResourcesController();
