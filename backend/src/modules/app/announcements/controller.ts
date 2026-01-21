import type { Request, Response } from "express";
import { announcementsService } from "./service";
import logger from "../../../utils/logger";

class AnnouncementsController {
  /**
   * Get announcements
   * GET /app/announcements
   */
  async getAnnouncements(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const announcements = await announcementsService.getAnnouncements(limit);

      return res.status(200).json({
        success: true,
        data: announcements,
      });
    } catch (error) {
      logger.error("AnnouncementsController.getAnnouncements error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get announcements: ${error}`,
      });
    }
  }
}

export const announcementsController = new AnnouncementsController();
