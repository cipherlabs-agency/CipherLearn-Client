import type { Request, Response } from "express";
import { announcementsService } from "./service";
import logger from "../../../utils/logger";
import { AnnouncementCategory } from "../../../../prisma/generated/prisma/enums";
import type { GetAnnouncementsQuery } from "./types";
import CloudinaryService from "../../../config/cloudinairy.config";
import { log } from "../../../utils/logtail";

const VALID_CATEGORIES = Object.values(AnnouncementCategory) as string[];
const cloudinary = new CloudinaryService();

class AnnouncementsController {
  /**
   * Get paginated announcements with optional category filter and search
   * GET /app/announcements?category=EXAM&search=winter&page=1&limit=10
   */
  async getAnnouncements(req: Request, res: Response): Promise<Response> {
    try {
      const { category, search, page, limit } = req.query;

      // Validate category if provided
      if (category && !VALID_CATEGORIES.includes(category as string)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        });
      }

      const parsedPage = page ? Math.max(1, parseInt(page as string, 10)) : 1;
      const parsedLimit = limit ? Math.min(50, Math.max(1, parseInt(limit as string, 10))) : 10;

      const query: GetAnnouncementsQuery & { batchId?: number } = {
        category: category as AnnouncementCategory | undefined,
        search: typeof search === "string" ? search.slice(0, 100) : undefined,
        page: isNaN(parsedPage) ? 1 : parsedPage,
        limit: isNaN(parsedLimit) ? 10 : parsedLimit,
        batchId: (req as any).student?.batchId ?? undefined,
      };

      const result = await announcementsService.getAnnouncements(query);

      return res.status(200).json({
        success: true,
        data: result.announcements,
        pagination: result.pagination,
      });
    } catch (error) {
      log("error", "app.announcements.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AnnouncementsController.getAnnouncements error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch announcements",
      });
    }
  }

  /**
   * Get full announcement detail
   * GET /app/announcements/:id
   */
  async getAnnouncementById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id) || id < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid announcement ID",
        });
      }

      const announcement = await announcementsService.getAnnouncementById(id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: "Announcement not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: announcement,
      });
    } catch (error) {
      log("error", "app.announcements.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AnnouncementsController.getAnnouncementById error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch announcement",
      });
    }
  }
  // ─── Teacher: POST /app/announcements/teacher ────────────────────────────────
  async createAnnouncement(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      const files = (req.files as Express.Multer.File[]) ?? [];
      const { title, description, body, category, department, pinned, notifyStudents, isDraft, scheduledAt, targetBatchIds } = req.body;

      if (!title?.trim() || !description?.trim()) {
        return res.status(400).json({ success: false, message: "Title and description are required" });
      }
      if (!category || !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        });
      }

      // Upload attachments
      let attachments: object[] = [];
      if (files.length) {
        const uploaded = await cloudinary.uploadDocuments(files, "announcements");
        attachments = uploaded.map((u) => ({
          url: u.url,
          filename: u.original_filename,
          size: u.bytes,
          mimeType: files.find((f) => f.originalname === u.original_filename)?.mimetype ?? "",
        }));
      }

      const parsedTargetBatchIds = Array.isArray(targetBatchIds)
        ? targetBatchIds.map(Number)
        : typeof targetBatchIds === "string"
        ? JSON.parse(targetBatchIds)
        : [];

      const announcement = await announcementsService.createTeacherAnnouncement(
        user.id,
        user.name,
        {
          title, description, body, category, department, attachments,
          pinned: pinned === "true" || pinned === true,
          isDraft: isDraft === "true" || isDraft === true,
          scheduledAt: scheduledAt || undefined,
          targetBatchIds: parsedTargetBatchIds,
        }
      );

      // Trigger Push Notification asynchronously (only if notifyStudents is explicitly true)
      if (notifyStudents === true || notifyStudents === "true") {
        require("../../../utils/pushNotifications")
          .sendToAllActiveStudents("schoolAnnouncements", title, description, { type: "ANNOUNCEMENT", id: announcement.id })
          .catch((e: Error) => logger.error("Failed to send announcement push notification", e));
      }

      return res.status(201).json({ success: true, message: "Announcement created", data: announcement });
    } catch (error) {
      log("error", "app.announcements.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AnnouncementsController.createAnnouncement error:", error);
      return res.status(500).json({ success: false, message: "Failed to create announcement" });
    }
  }

  // ─── Teacher: PUT /app/announcements/teacher/:id ──────────────────────────────
  async updateAnnouncement(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

      const { title, description, body, category, department, pinned, isDraft, scheduledAt, targetBatchIds } = req.body;
      if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ success: false, message: `Invalid category` });
      }

      const parsedTargetBatchIds = Array.isArray(targetBatchIds)
        ? targetBatchIds.map(Number)
        : typeof targetBatchIds === "string"
        ? JSON.parse(targetBatchIds)
        : undefined;

      const announcement = await announcementsService.updateTeacherAnnouncement(id, user.id, {
        title, description, body, category, department,
        pinned: pinned !== undefined ? (pinned === "true" || pinned === true) : undefined,
        isDraft: isDraft !== undefined ? (isDraft === "true" || isDraft === true) : undefined,
        scheduledAt: scheduledAt !== undefined ? scheduledAt || null : undefined,
        targetBatchIds: parsedTargetBatchIds,
      });
      return res.json({ success: true, data: announcement });
    } catch (error: any) {
      log("error", "app.announcements.json failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message?.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      logger.error("AnnouncementsController.updateAnnouncement error:", error);
      return res.status(500).json({ success: false, message: "Failed to update announcement" });
    }
  }

  // ─── Teacher: DELETE /app/announcements/teacher/:id ──────────────────────────
  async deleteAnnouncement(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

      await announcementsService.deleteTeacherAnnouncement(id, user.id);
      return res.json({ success: true, message: "Announcement deleted" });
    } catch (error: any) {
      log("error", "app.announcements.json failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message?.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      logger.error("AnnouncementsController.deleteAnnouncement error:", error);
      return res.status(500).json({ success: false, message: "Failed to delete announcement" });
    }
  }

  // ─── Teacher: PUT /app/announcements/teacher/:id/pin ─────────────────────────
  async togglePin(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

      const result = await announcementsService.togglePinAnnouncement(id, user.id);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      log("error", "app.announcements.json failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message?.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      logger.error("AnnouncementsController.togglePin error:", error);
      return res.status(500).json({ success: false, message: "Failed to toggle pin" });
    }
  }
}

export const announcementsController = new AnnouncementsController();
