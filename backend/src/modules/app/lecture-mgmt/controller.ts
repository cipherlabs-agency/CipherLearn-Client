import { Request, Response } from "express";
import LectureService from "../../dashboard/lectures/service";
import logger from "../../../utils/logger";

/**
 * App lecture-management controller — bulk-create (recurring) lectures and
 * assign a teacher to a lecture. Reuses the dashboard LectureService.
 */
const lectureService = new LectureService();

export class AppLectureMgmtController {
  // POST /app/lectures/teacher/bulk
  // Body: { title, subject, batchId, startTime, endTime, description?, room?, teacherId?, recurrence:{ days[], startDate, endDate } }
  async createBulk(req: Request, res: Response) {
    try {
      const b = req.body || {};
      if (!b.title || !b.subject || b.batchId == null || !b.startTime || !b.endTime || !b.recurrence) {
        return res.status(400).json({ success: false, message: "title, subject, batchId, startTime, endTime and recurrence are required" });
      }
      const result = await lectureService.createBulk(b, req.user!.id);
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error("AppLectureMgmt.createBulk error:", error);
      const msg = error instanceof Error ? error.message : "Failed to create lectures";
      return res.status(500).json({ success: false, message: msg });
    }
  }

  // PUT /app/lectures/teacher/:id/assign  { teacherId }
  async assignTeacher(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const teacherId = Number(req.body?.teacherId);
      if (!teacherId) return res.status(400).json({ success: false, message: "teacherId is required" });
      const data = await lectureService.assignTeacher(id, teacherId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppLectureMgmt.assignTeacher error:", error);
      const msg = error instanceof Error ? error.message : "Failed to assign teacher";
      return res.status(msg.includes("not found") ? 404 : 500).json({ success: false, message: msg });
    }
  }
}

export const appLectureMgmtController = new AppLectureMgmtController();
