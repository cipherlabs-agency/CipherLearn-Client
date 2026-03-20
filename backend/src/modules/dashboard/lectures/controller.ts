import type { Request, Response } from "express";
import LectureService from "./service";
import logger from "../../../utils/logger";
import { CreateLectureInput, CreateBulkLecturesInput, UpdateLectureInput, GetLecturesQuery } from "./types";
import { LectureStatus } from "../../../../prisma/generated/prisma/enums";
import { log } from "../../../utils/logtail";

const lectureService = new LectureService();

export default class LectureController {
  public async create(req: Request, res: Response) {
    try {
      const data: CreateLectureInput = req.body;
      const userId = req.user!.id;

      const lecture = await lectureService.create(data, userId);

      const assignMsg = lecture.teacher
        ? ` and ${lecture.assignedBy === "auto" ? "auto-assigned" : "assigned"} to ${lecture.teacher.name}`
        : "";

      logger.info(`Lecture created: "${lecture.title}"${assignMsg} by ${req.user!.name}`);

      return res.status(201).json({
        success: true,
        message: `Lecture created successfully${assignMsg}`,
        data: lecture,
      });
    } catch (error: any) {
      log("error", "dashboard.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("LectureController.create error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("End time")) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to create lecture: ${error.message}`,
      });
    }
  }

  public async createBulk(req: Request, res: Response) {
    try {
      const data: CreateBulkLecturesInput = req.body;
      const userId = req.user!.id;

      const result = await lectureService.createBulk(data, userId);

      logger.info(`Bulk lectures created: ${result.created} lectures by ${req.user!.name}`);

      return res.status(201).json({
        success: true,
        message: `${result.created} lectures created successfully`,
        data: result,
      });
    } catch (error: any) {
      log("error", "dashboard.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("LectureController.createBulk error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("No lectures") || error.message.includes("End time")) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to create lectures: ${error.message}`,
      });
    }
  }

  public async getAll(req: Request, res: Response) {
    try {
      const query: GetLecturesQuery = {
        batchId: req.query.batchId ? Number(req.query.batchId) : undefined,
        teacherId: req.query.teacherId ? Number(req.query.teacherId) : undefined,
        status: req.query.status as LectureStatus | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const result = await lectureService.getAll(query);

      return res.status(200).json({
        success: true,
        data: result.lectures,
        pagination: result.pagination,
      });
    } catch (error: any) {
      log("error", "dashboard.lectures.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("LectureController.getAll error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch lectures: ${error.message}`,
      });
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const lecture = await lectureService.getById(Number(req.params.id));

      return res.status(200).json({
        success: true,
        data: lecture,
      });
    } catch (error: any) {
      log("error", "dashboard.lectures.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("LectureController.getById error:", error);

      if (error.message === "Lecture not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to fetch lecture: ${error.message}`,
      });
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const data: UpdateLectureInput = req.body;
      const lecture = await lectureService.update(Number(req.params.id), data);

      logger.info(`Lecture updated: "${lecture.title}" by ${req.user!.name}`);

      return res.status(200).json({
        success: true,
        message: "Lecture updated successfully",
        data: lecture,
      });
    } catch (error: any) {
      log("error", "dashboard.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("LectureController.update error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("End time")) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to update lecture: ${error.message}`,
      });
    }
  }

  public async assignTeacher(req: Request, res: Response) {
    try {
      const { teacherId } = req.body;
      const lecture = await lectureService.assignTeacher(Number(req.params.id), teacherId);

      logger.info(`Teacher assigned to lecture "${lecture.title}": ${lecture.teacher?.name} by ${req.user!.name}`);

      return res.status(200).json({
        success: true,
        message: `Teacher ${lecture.teacher?.name} assigned successfully`,
        data: lecture,
      });
    } catch (error: any) {
      log("error", "dashboard.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("LectureController.assignTeacher error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to assign teacher: ${error.message}`,
      });
    }
  }

  public async updateStatus(req: Request, res: Response) {
    try {
      const { status, notes } = req.body;
      const lecture = await lectureService.updateStatus(Number(req.params.id), status as LectureStatus, notes);

      logger.info(`Lecture status updated: "${lecture.title}" -> ${status} by ${req.user!.name}`);

      return res.status(200).json({
        success: true,
        message: `Lecture status updated to ${status}`,
        data: lecture,
      });
    } catch (error: any) {
      log("error", "dashboard.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("LectureController.updateStatus error:", error);

      if (error.message === "Lecture not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to update lecture status: ${error.message}`,
      });
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      await lectureService.delete(Number(req.params.id));

      logger.info(`Lecture deleted: ID ${req.params.id} by ${req.user!.name}`);

      return res.status(200).json({
        success: true,
        message: "Lecture deleted successfully",
      });
    } catch (error: any) {
      log("error", "dashboard.lectures.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("LectureController.delete error:", error);

      if (error.message === "Lecture not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to delete lecture: ${error.message}`,
      });
    }
  }

  public async getSchedule(req: Request, res: Response) {
    try {
      const { startDate, endDate, batchId, teacherId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const lectures = await lectureService.getSchedule({
        startDate: startDate as string,
        endDate: endDate as string,
        batchId: batchId ? Number(batchId) : undefined,
        teacherId: teacherId ? Number(teacherId) : undefined,
      });

      return res.status(200).json({
        success: true,
        data: lectures,
      });
    } catch (error: any) {
      log("error", "dashboard.lectures.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("LectureController.getSchedule error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch schedule: ${error.message}`,
      });
    }
  }
}
