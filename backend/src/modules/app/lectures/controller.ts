import type { Request, Response } from "express";
import AppLectureService from "./service";
import logger from "../../../utils/logger";
import { UserRoles } from "../../../../prisma/generated/prisma/enums";
import { log } from "../../../utils/logtail";
import CloudinaryService from "../../../config/cloudinairy.config";

const cloudinaryService = new CloudinaryService();

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

  // ==================== TEACHER CRUD ====================

  public async createLecture(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { title, subject, batchId, date, startTime, endTime, room, description, isOnline, meetingLink, notifyStudents } = req.body;

      if (!title?.trim() || !subject?.trim() || !batchId || !date || !startTime || !endTime) {
        return res.status(400).json({ success: false, message: "title, subject, batchId, date, startTime, endTime are required" });
      }

      // Handle file attachments
      const files = (req.files as Express.Multer.File[]) ?? [];
      let attachments: object[] = [];
      if (files.length > 0) {
        const uploaded = await cloudinaryService.uploadDocuments(files, "lecture_attachments");
        attachments = uploaded.map((u) => ({
          url: u.url,
          publicId: u.public_id,
          originalFilename: u.original_filename,
          size: u.bytes,
          mimeType: files.find((f) => f.originalname === u.original_filename)?.mimetype ?? "",
        }));
      }

      const lecture = await lectureService.createLecture({
        title,
        subject,
        batchId: Number(batchId),
        date: new Date(date),
        startTime,
        endTime,
        room,
        description,
        isOnline: isOnline === true || isOnline === "true",
        meetingLink,
        attachments: attachments.length > 0 ? attachments : undefined,
        teacherId: user.id,
        createdByName: user.name,
      });

      if (notifyStudents === true || notifyStudents === "true") {
        import("../../../utils/pushNotifications").then(({ sendToBatchStudents }) => {
          sendToBatchStudents(Number(batchId), "classStartingSoon", `New Class Scheduled: ${title}`, `${subject} on ${new Date(date).toDateString()} at ${startTime}`).catch(() => {});
        });
      }

      return res.status(201).json({ success: true, message: "Lecture scheduled", data: lecture });
    } catch (error: any) {
      log("error", "app.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppLectureController.createLecture error:", error);
      return res.status(400).json({ success: false, message: error.message || "Failed to create lecture" });
    }
  }

  public async updateLecture(req: Request, res: Response) {
    try {
      const user = req.user!;
      const lectureId = Number(req.params.id);
      if (isNaN(lectureId)) return res.status(400).json({ success: false, message: "Invalid lecture ID" });

      const { title, subject, batchId, date, startTime, endTime, room, description, isOnline, meetingLink, status } = req.body;

      // Handle new file attachments
      const files = (req.files as Express.Multer.File[]) ?? [];
      let attachments: object[] | undefined;
      if (files.length > 0) {
        const uploaded = await cloudinaryService.uploadDocuments(files, "lecture_attachments");
        attachments = uploaded.map((u) => ({
          url: u.url,
          publicId: u.public_id,
          originalFilename: u.original_filename,
          size: u.bytes,
          mimeType: files.find((f) => f.originalname === u.original_filename)?.mimetype ?? "",
        }));
      }

      const lecture = await lectureService.updateLecture(lectureId, user.id, {
        ...(title !== undefined && { title }),
        ...(subject !== undefined && { subject }),
        ...(batchId !== undefined && { batchId: Number(batchId) }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(room !== undefined && { room }),
        ...(description !== undefined && { description }),
        ...(isOnline !== undefined && { isOnline: isOnline === true || isOnline === "true" }),
        ...(meetingLink !== undefined && { meetingLink }),
        ...(status !== undefined && { status }),
        ...(attachments !== undefined && { attachments }),
      });

      return res.status(200).json({ success: true, message: "Lecture updated", data: lecture });
    } catch (error: any) {
      log("error", "app.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppLectureController.updateLecture error:", error);
      return res.status(400).json({ success: false, message: error.message || "Failed to update lecture" });
    }
  }

  public async deleteLecture(req: Request, res: Response) {
    try {
      const user = req.user!;
      const lectureId = Number(req.params.id);
      if (isNaN(lectureId)) return res.status(400).json({ success: false, message: "Invalid lecture ID" });

      await lectureService.deleteLecture(lectureId, user.id);

      return res.status(200).json({ success: true, message: "Lecture deleted" });
    } catch (error: any) {
      log("error", "app.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppLectureController.deleteLecture error:", error);
      return res.status(400).json({ success: false, message: error.message || "Failed to delete lecture" });
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
