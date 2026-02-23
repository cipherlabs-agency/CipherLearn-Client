import type { Request, Response } from "express";
import { announcementsService } from "./service";
import logger from "../../../utils/logger";
import { AnnouncementCategory } from "../../../../prisma/generated/prisma/enums";
import type { GetAnnouncementsQuery } from "./types";

const VALID_CATEGORIES = Object.values(AnnouncementCategory) as string[];

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

      const query: GetAnnouncementsQuery = {
        category: category as AnnouncementCategory | undefined,
        search: typeof search === "string" ? search.slice(0, 100) : undefined,
        page: isNaN(parsedPage) ? 1 : parsedPage,
        limit: isNaN(parsedLimit) ? 10 : parsedLimit,
      };

      const result = await announcementsService.getAnnouncements(query);

      return res.status(200).json({
        success: true,
        data: result.announcements,
        pagination: result.pagination,
      });
    } catch (error) {
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
      logger.error("AnnouncementsController.getAnnouncementById error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch announcement",
      });
    }
  }
}

export const announcementsController = new AnnouncementsController();
