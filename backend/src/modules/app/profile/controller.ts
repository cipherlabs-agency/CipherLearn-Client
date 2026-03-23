import type { Request, Response } from "express";
import { profileService } from "./service";
import logger from "../../../utils/logger";
import { log } from "../../../utils/logtail";

class ProfileController {
  /**
   * Get student profile
   * GET /app/profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({ success: false, message: "Student not authenticated" });
      }

      const profile = await profileService.getProfile(student.id);
      return res.status(200).json({ success: true, data: profile });
    } catch (error) {
      log("error", "app.profile.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ProfileController.getProfile error:", error);
      return res.status(500).json({ success: false, message: `Failed to get profile: ${error}` });
    }
  }

  /**
   * Student: update own profile
   * PUT /app/profile
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({ success: false, message: "Student not authenticated" });
      }

      const { phone, address, parentName } = req.body;
      const updated = await profileService.updateStudentProfile(student.id, { phone, address, parentName });
      return res.status(200).json({ success: true, message: "Profile updated", data: updated });
    } catch (error) {
      log("error", "app.profile.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ProfileController.updateProfile error:", error);
      return res.status(500).json({ success: false, message: "Failed to update profile" });
    }
  }

  /**
   * Teacher: get own profile
   * GET /app/profile/teacher
   */
  async getTeacherProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const profile = await profileService.getTeacherProfile(user.id);
      return res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
      log("error", "app.profile.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ProfileController.getTeacherProfile error:", error);
      if (error.message === "Teacher not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: "Failed to get teacher profile" });
    }
  }

  /**
   * Teacher: update own profile
   * PUT /app/profile/teacher
   */
  async updateTeacherProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const {
        phone, gender, qualification, university, experience,
        workTimingFrom, workTimingTo, primarySubjects, secondarySubjects, bio,
      } = req.body;

      const updated = await profileService.updateTeacherProfile(user.id, {
        phone,
        gender,
        qualification,
        university,
        experience: experience !== undefined ? parseInt(experience) : undefined,
        workTimingFrom,
        workTimingTo,
        primarySubjects: Array.isArray(primarySubjects) ? primarySubjects : undefined,
        secondarySubjects: Array.isArray(secondarySubjects) ? secondarySubjects : undefined,
        bio,
      });
      return res.status(200).json({ success: true, message: "Profile updated", data: updated });
    } catch (error) {
      log("error", "app.profile.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ProfileController.updateTeacherProfile error:", error);
      return res.status(500).json({ success: false, message: "Failed to update teacher profile" });
    }
  }

  /**
   * Student: upload profile avatar
   * PUT /app/profile/avatar  (multipart, field: "avatar")
   */
  async uploadAvatar(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({ success: false, message: "Student not authenticated" });
      }
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ success: false, message: "No image file uploaded" });
      }
      const result = await profileService.updateStudentAvatar(student.id, file);
      return res.status(200).json({ success: true, message: "Avatar updated", data: result });
    } catch (error) {
      log("error", "app.profile.avatar failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ProfileController.uploadAvatar error:", error);
      return res.status(500).json({ success: false, message: "Failed to upload avatar" });
    }
  }

  /**
   * Teacher: upload profile avatar
   * PUT /app/profile/teacher/avatar  (multipart, field: "avatar")
   */
  async uploadTeacherAvatar(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ success: false, message: "No image file uploaded" });
      }
      const result = await profileService.updateTeacherAvatar(user.id, file);
      return res.status(200).json({ success: true, message: "Avatar updated", data: result });
    } catch (error) {
      log("error", "app.profile.teacher.avatar failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ProfileController.uploadTeacherAvatar error:", error);
      return res.status(500).json({ success: false, message: "Failed to upload avatar" });
    }
  }

  /**
   * Student: get their class teacher info (Ask Doubts screen)
   * GET /app/teachers/my-teacher
   */
  async getMyTeacher(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({ success: false, message: "Student not authenticated" });
      }
      if (!student.batchId) {
        return res.status(400).json({ success: false, message: "Student not assigned to a batch" });
      }

      const teacher = await profileService.getMyTeacher(student.id, student.batchId);
      if (!teacher) {
        return res.status(404).json({ success: false, message: "No teacher found for your batch" });
      }
      return res.status(200).json({ success: true, data: teacher });
    } catch (error) {
      log("error", "app.profile.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("ProfileController.getMyTeacher error:", error);
      return res.status(500).json({ success: false, message: "Failed to get teacher info" });
    }
  }
}

export const profileController = new ProfileController();
