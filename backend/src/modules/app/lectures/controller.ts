import type { Request, Response } from "express";
import AppLectureService from "./service";
import logger from "../../../utils/logger";
import { UserRoles } from "../../../../prisma/generated/prisma/enums";
import { log } from "../../../utils/logtail";

const lectureService = new AppLectureService();

export default class AppLectureController {
  public async getMySchedule(req: Request, res: Response) {
    try {
      const user = req.user!;
      const date = req.query.date as string | undefined;

      if (user.role === UserRoles.TEACHER) {
        const schedule = await lectureService.getTeacherSchedule(user.id, date);
        return res.status(200).json({ success: true, data: schedule });
      }

      if (user.role === UserRoles.STUDENT) {
        const student = req.student;
        if (!student?.batchId) {
          return res.status(400).json({
            success: false,
            message: "Student is not assigned to any batch",
          });
        }
        const schedule = await lectureService.getStudentSchedule(student.batchId, date);
        return res.status(200).json({ success: true, data: schedule });
      }

      return res.status(403).json({ success: false, message: "Access denied" });
    } catch (error: any) {
      log("error", "app.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppLectureController.getMySchedule error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch schedule: ${error.message}`,
      });
    }
  }

  public async getLectureById(req: Request, res: Response) {
    try {
      const lecture = await lectureService.getLectureById(Number(req.params.id));

      return res.status(200).json({
        success: true,
        data: lecture,
      });
    } catch (error: any) {
      log("error", "app.lectures.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AppLectureController.getLectureById error:", error);

      if (error.message === "Lecture not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to fetch lecture: ${error.message}`,
      });
    }
  }

  public async addNotes(req: Request, res: Response) {
    try {
      const user = req.user!;
      if (user.role !== UserRoles.TEACHER) {
        return res.status(403).json({ success: false, message: "Only teachers can add notes" });
      }

      const { notes } = req.body;
      if (!notes) {
        return res.status(400).json({ success: false, message: "Notes are required" });
      }

      const lecture = await lectureService.addNotes(Number(req.params.id), user.id, notes);

      return res.status(200).json({
        success: true,
        message: "Notes added successfully",
        data: lecture,
      });
    } catch (error: any) {
      log("error", "app.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppLectureController.addNotes error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to add notes: ${error.message}`,
      });
    }
  }

  public async markComplete(req: Request, res: Response) {
    try {
      const user = req.user!;
      if (user.role !== UserRoles.TEACHER) {
        return res.status(403).json({ success: false, message: "Only teachers can mark lectures as complete" });
      }

      const { notes } = req.body;
      const lecture = await lectureService.markComplete(Number(req.params.id), user.id, notes);

      logger.info(`Lecture completed: "${lecture.title}" by ${user.name}`);

      return res.status(200).json({
        success: true,
        message: "Lecture marked as completed",
        data: lecture,
      });
    } catch (error: any) {
      log("error", "app.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppLectureController.markComplete error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to mark lecture as complete: ${error.message}`,
      });
    }
  }
}
