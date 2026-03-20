import { Request, Response } from "express";
import { doubtsService } from "./service";
import logger from "../../../utils/logger";
import { DoubtStatus } from "../../../../prisma/generated/prisma/enums";
import { log } from "../../../utils/logtail";

export class DoubtsController {
  // ─── Student: GET /app/doubts ────────────────────────────────────────────────
  async getMyDoubts(req: Request, res: Response): Promise<Response> {
    try {
      const studentId = (req as any).user.studentId as number;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      const result = await doubtsService.getStudentDoubts(studentId, page, limit);
      return res.json({ success: true, data: result });
    } catch (error) {
      log("error", "app.doubts.json failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("DoubtsController.getMyDoubts error", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch doubts" });
    }
  }

  // ─── Student: POST /app/doubts ────────────────────────────────────────────────
  async postDoubt(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      const { title, description, subject } = req.body;

      if (!title?.trim() || !description?.trim()) {
        return res.status(400).json({ success: false, message: "Title and description are required" });
      }
      if (title.length > 200) {
        return res.status(400).json({ success: false, message: "Title too long (max 200 chars)" });
      }
      if (description.length > 2000) {
        return res.status(400).json({ success: false, message: "Description too long (max 2000 chars)" });
      }
      if (!user.batchId) {
        return res.status(400).json({ success: false, message: "You are not enrolled in a batch" });
      }

      const doubt = await doubtsService.postDoubt(user.studentId, user.batchId, {
        title,
        description,
        subject,
      });
      return res.status(201).json({ success: true, data: doubt });
    } catch (error) {
      log("error", "app.doubts.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("DoubtsController.postDoubt error", { error });
      return res.status(500).json({ success: false, message: "Failed to post doubt" });
    }
  }

  // ─── Student: GET /app/doubts/:id ────────────────────────────────────────────
  async getDoubtThread(req: Request, res: Response): Promise<Response> {
    try {
      const studentId = (req as any).user.studentId as number;
      const doubtId = parseInt(req.params.id);
      if (isNaN(doubtId)) {
        return res.status(400).json({ success: false, message: "Invalid doubt ID" });
      }

      const thread = await doubtsService.getDoubtThread(doubtId, studentId);
      return res.json({ success: true, data: thread });
    } catch (error: any) {
      log("error", "app.doubts.json failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message === "Doubt not found") {
        return res.status(404).json({ success: false, message: "Doubt not found" });
      }
      logger.error("DoubtsController.getDoubtThread error", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch doubt" });
    }
  }

  // ─── Teacher: GET /app/doubts/teacher ────────────────────────────────────────
  async getTeacherDoubts(req: Request, res: Response): Promise<Response> {
    try {
      const teacherId = (req as any).user.id as number;
      const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
      const status = req.query.status as DoubtStatus | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      const result = await doubtsService.getTeacherDoubts(teacherId, batchId, status, page, limit);
      return res.json({ success: true, data: result });
    } catch (error) {
      log("error", "app.doubts.json failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("DoubtsController.getTeacherDoubts error", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch doubts" });
    }
  }

  // ─── Teacher: POST /app/doubts/:id/reply ─────────────────────────────────────
  async replyToDoubt(req: Request, res: Response): Promise<Response> {
    try {
      const teacherId = (req as any).user.id as number;
      const doubtId = parseInt(req.params.id);
      if (isNaN(doubtId)) {
        return res.status(400).json({ success: false, message: "Invalid doubt ID" });
      }

      const { body } = req.body;
      if (!body?.trim()) {
        return res.status(400).json({ success: false, message: "Reply body is required" });
      }
      if (body.length > 2000) {
        return res.status(400).json({ success: false, message: "Reply too long (max 2000 chars)" });
      }

      const thread = await doubtsService.replyToDoubt(doubtId, teacherId, { body });
      return res.status(201).json({ success: true, data: thread });
    } catch (error: any) {
      log("error", "app.doubts.status failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message?.includes("Access denied") || error.message === "Doubt not found") {
        return res.status(error.message === "Doubt not found" ? 404 : 403).json({
          success: false,
          message: error.message,
        });
      }
      logger.error("DoubtsController.replyToDoubt error", { error });
      return res.status(500).json({ success: false, message: "Failed to post reply" });
    }
  }

  // ─── Teacher/Student: PUT /app/doubts/:id/resolve ────────────────────────────
  async resolveDoubt(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      const doubtId = parseInt(req.params.id);
      if (isNaN(doubtId)) {
        return res.status(400).json({ success: false, message: "Invalid doubt ID" });
      }

      // For student, use studentId; for teacher, use user.id
      const userId = user.role === "STUDENT" ? user.studentId : user.id;
      const doubt = await doubtsService.resolveDoubt(doubtId, userId, user.role);
      return res.json({ success: true, data: doubt });
    } catch (error: any) {
      log("error", "app.doubts.json failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message === "Doubt not found") {
        return res.status(404).json({ success: false, message: "Doubt not found" });
      }
      if (error.message === "Access denied") {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      logger.error("DoubtsController.resolveDoubt error", { error });
      return res.status(500).json({ success: false, message: "Failed to resolve doubt" });
    }
  }
}

export const doubtsController = new DoubtsController();
