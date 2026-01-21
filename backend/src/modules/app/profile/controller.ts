import type { Request, Response } from "express";
import { profileService } from "./service";
import logger from "../../../utils/logger";

class ProfileController {
  /**
   * Get student profile
   * GET /app/profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const profile = await profileService.getProfile(student.id);

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error("ProfileController.getProfile error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get profile: ${error}`,
      });
    }
  }
}

export const profileController = new ProfileController();
