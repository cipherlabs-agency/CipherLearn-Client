import { Request, Response } from "express";
import { announcementService } from "./service";
import { AnnouncementPriority } from "../../../../prisma/generated/prisma/enums";

export class AnnouncementController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, imageUrl, date, priority } = req.body;
      const createdBy = req.user?.name || "Unknown";

      // Handle file upload if present
      const file = req.file as Express.Multer.File | undefined;
      const finalImageUrl = file
        ? `/uploads/announcements/${file.filename}`
        : imageUrl;

      const announcement = await announcementService.create({
        title,
        description,
        imageUrl: finalImageUrl,
        date,
        priority: priority as AnnouncementPriority,
        createdBy,
      });

      res.status(201).json({
        success: true,
        message: "Announcement created successfully",
        data: announcement,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create announcement";
      res.status(500).json({ success: false, message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, priority, isActive } = req.query;

      const result = await announcementService.getAll({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        priority: priority as AnnouncementPriority | undefined,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
      });

      res.json({
        success: true,
        data: result.announcements,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch announcements";
      res.status(500).json({ success: false, message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const announcement = await announcementService.getById(parseInt(id, 10));

      if (!announcement) {
        res.status(404).json({ success: false, message: "Announcement not found" });
        return;
      }

      res.json({ success: true, data: announcement });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch announcement";
      res.status(500).json({ success: false, message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, imageUrl, date, priority, isActive } = req.body;

      // Handle file upload if present
      const file = req.file as Express.Multer.File | undefined;
      const finalImageUrl = file
        ? `/uploads/announcements/${file.filename}`
        : imageUrl;

      const announcement = await announcementService.update(parseInt(id, 10), {
        title,
        description,
        imageUrl: finalImageUrl,
        date,
        priority: priority as AnnouncementPriority | undefined,
        isActive,
      });

      res.json({
        success: true,
        message: "Announcement updated successfully",
        data: announcement,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update announcement";
      res.status(500).json({ success: false, message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await announcementService.delete(parseInt(id, 10));
      res.json({ success: true, message: "Announcement deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete announcement";
      res.status(500).json({ success: false, message });
    }
  }

  async getActive(req: Request, res: Response): Promise<void> {
    try {
      const announcements = await announcementService.getActiveAnnouncements();
      res.json({ success: true, data: announcements });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch announcements";
      res.status(500).json({ success: false, message });
    }
  }
}

export const announcementController = new AnnouncementController();
