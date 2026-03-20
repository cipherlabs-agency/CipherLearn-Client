import { Request, Response } from "express";
import { studyMaterialService } from "./service";
import { log } from "../../../utils/logtail";

export class StudyMaterialController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, batchId, category } = req.body;
      const createdBy = req.user?.name || "Unknown";
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: "No files uploaded" });
        return;
      }

      const fileUrls = files.map((file) => `/uploads/study-materials/${file.filename}`);

      const material = await studyMaterialService.create({
        title,
        description,
        files: fileUrls,
        batchId: parseInt(batchId, 10),
        category,
        createdBy,
      });

      res.status(201).json({
        success: true,
        message: "Study material created successfully",
        data: material,
      });
    } catch (error) {
      log("error", "dashboard.study-materials.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      const message = error instanceof Error ? error.message : "Failed to create study material";
      res.status(500).json({ success: false, message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { batchId, category, page, limit } = req.query;

      const result = await studyMaterialService.getAll({
        batchId: batchId ? parseInt(batchId as string, 10) : undefined,
        category: category as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      res.json({
        success: true,
        data: result.materials,
        pagination: result.pagination,
      });
    } catch (error) {
      log("error", "dashboard.study-materials.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to fetch study materials";
      res.status(500).json({ success: false, message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const material = await studyMaterialService.getById(parseInt(id, 10));

      if (!material) {
        res.status(404).json({ success: false, message: "Study material not found" });
        return;
      }

      res.json({ success: true, data: material });
    } catch (error) {
      log("error", "dashboard.study-materials.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to fetch study material";
      res.status(500).json({ success: false, message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, category } = req.body;
      const files = req.files as Express.Multer.File[] | undefined;

      const updateData: {
        title?: string;
        description?: string;
        category?: string;
        files?: string[];
      } = {
        title,
        description,
        category,
      };

      if (files && files.length > 0) {
        updateData.files = files.map((file) => `/uploads/study-materials/${file.filename}`);
      }

      const material = await studyMaterialService.update(parseInt(id, 10), updateData);

      res.json({
        success: true,
        message: "Study material updated successfully",
        data: material,
      });
    } catch (error) {
      log("error", "dashboard.study-materials.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to update study material";
      res.status(500).json({ success: false, message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await studyMaterialService.delete(parseInt(id, 10));
      res.json({ success: true, message: "Study material deleted successfully" });
    } catch (error) {
      log("error", "dashboard.study-materials.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to delete study material";
      res.status(500).json({ success: false, message });
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await studyMaterialService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      log("error", "dashboard.study-materials.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to fetch categories";
      res.status(500).json({ success: false, message });
    }
  }
}

export const studyMaterialController = new StudyMaterialController();
