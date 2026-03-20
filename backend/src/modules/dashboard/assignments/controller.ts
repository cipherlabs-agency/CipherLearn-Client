import { Request, Response } from "express";
import { assignmentService } from "./service";
import {
  CreateAssignmentSlotInput,
  UpdateAssignmentSlotInput,
  ReviewSubmissionInput,
} from "./types";
import { log } from "../../../utils/logtail";

export class AssignmentController {
  // ==================== ASSIGNMENT SLOTS ====================

  async createSlot(req: Request, res: Response): Promise<void> {
    try {
      const { title, subject, description, batchId, dueDate } = req.body;
      const createdBy = req.user?.name || "Unknown";
      const files = req.files as Express.Multer.File[] | undefined;

      // Map uploaded files to URLs
      const attachments = files?.map((file) => `/uploads/assignments/${file.filename}`) || [];

      const input: CreateAssignmentSlotInput = {
        title,
        subject,
        description,
        attachments,
        batchId: parseInt(batchId, 10),
        dueDate,
        createdBy,
      };

      const slot = await assignmentService.createSlot(input);
      res.status(201).json({
        success: true,
        message: "Assignment slot created successfully",
        data: slot,
      });
    } catch (error) {
      log("error", "dashboard.assignments.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      const message = error instanceof Error ? error.message : "Failed to create slot";
      res.status(500).json({ success: false, message });
    }
  }

  async getSlots(req: Request, res: Response): Promise<void> {
    try {
      const { batchId, page, limit, includeExpired } = req.query;

      const result = await assignmentService.getSlots({
        batchId: batchId ? parseInt(batchId as string, 10) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        includeExpired: includeExpired !== "false",
      });

      res.json({
        success: true,
        data: result.slots,
        pagination: result.pagination,
      });
    } catch (error) {
      log("error", "dashboard.assignments.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to fetch slots";
      res.status(500).json({ success: false, message });
    }
  }

  async getSlotById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const slot = await assignmentService.getSlotById(parseInt(id, 10));

      if (!slot) {
        res.status(404).json({ success: false, message: "Slot not found" });
        return;
      }

      res.json({ success: true, data: slot });
    } catch (error) {
      log("error", "dashboard.assignments.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to fetch slot";
      res.status(500).json({ success: false, message });
    }
  }

  async updateSlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, subject, description, batchId, dueDate, existingAttachments } = req.body;
      const files = req.files as Express.Multer.File[] | undefined;

      // Map new uploaded files to URLs
      const newAttachments = files?.map((file) => `/uploads/assignments/${file.filename}`) || [];

      // Combine existing attachments with new ones
      const existingFiles = existingAttachments ? JSON.parse(existingAttachments) : [];
      const attachments = [...existingFiles, ...newAttachments];

      const input: UpdateAssignmentSlotInput = {
        title,
        subject,
        description,
        attachments: attachments.length > 0 ? attachments : undefined,
        batchId: batchId ? parseInt(batchId, 10) : undefined,
        dueDate,
      };

      const slot = await assignmentService.updateSlot(parseInt(id, 10), input);
      res.json({
        success: true,
        message: "Assignment slot updated successfully",
        data: slot,
      });
    } catch (error) {
      log("error", "dashboard.assignments.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to update slot";
      res.status(500).json({ success: false, message });
    }
  }

  async deleteSlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await assignmentService.deleteSlot(parseInt(id, 10));
      res.json({ success: true, message: "Assignment slot deleted successfully" });
    } catch (error) {
      log("error", "dashboard.assignments.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to delete slot";
      res.status(500).json({ success: false, message });
    }
  }

  // ==================== STUDENT SUBMISSIONS ====================

  async createSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { slotId, studentId } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: "No files uploaded" });
        return;
      }

      // Map uploaded files to URLs
      const fileUrls = files.map((file) => `/uploads/assignments/${file.filename}`);

      const submission = await assignmentService.createSubmission({
        slotId: parseInt(slotId, 10),
        studentId: parseInt(studentId, 10),
        files: fileUrls,
      });

      res.status(201).json({
        success: true,
        message: "Assignment submitted successfully",
        data: submission,
      });
    } catch (error) {
      log("error", "dashboard.assignments.status failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to submit assignment";
      res.status(500).json({ success: false, message });
    }
  }

  async getSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { slotId, studentId, status, page, limit } = req.query;

      const result = await assignmentService.getSubmissions({
        slotId: slotId ? parseInt(slotId as string, 10) : undefined,
        studentId: studentId ? parseInt(studentId as string, 10) : undefined,
        status: status as "PENDING" | "ACCEPTED" | "REJECTED" | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      res.json({
        success: true,
        data: result.submissions,
        pagination: result.pagination,
      });
    } catch (error) {
      log("error", "dashboard.assignments.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to fetch submissions";
      res.status(500).json({ success: false, message });
    }
  }

  async getSubmissionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const submission = await assignmentService.getSubmissionById(parseInt(id, 10));

      if (!submission) {
        res.status(404).json({ success: false, message: "Submission not found" });
        return;
      }

      res.json({ success: true, data: submission });
    } catch (error) {
      log("error", "dashboard.assignments.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to fetch submission";
      res.status(500).json({ success: false, message });
    }
  }

  async getMySubmission(req: Request, res: Response): Promise<void> {
    try {
      const { slotId } = req.params;
      const { studentId } = req.query;

      if (!studentId) {
        res.status(400).json({ success: false, message: "Student ID required" });
        return;
      }

      const submission = await assignmentService.getStudentSubmissionForSlot(
        parseInt(slotId, 10),
        parseInt(studentId as string, 10)
      );

      res.json({ success: true, data: submission });
    } catch (error) {
      log("error", "dashboard.assignments.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to fetch submission";
      res.status(500).json({ success: false, message });
    }
  }

  async reviewSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;
      const reviewedBy = req.user?.name || "Unknown";

      const input: ReviewSubmissionInput = {
        status,
        feedback,
        reviewedBy,
      };

      const submission = await assignmentService.reviewSubmission(parseInt(id, 10), input);
      res.json({
        success: true,
        message: `Submission ${status.toLowerCase()} successfully`,
        data: submission,
      });
    } catch (error) {
      log("error", "dashboard.assignments.toLowerCase failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      const message = error instanceof Error ? error.message : "Failed to review submission";
      res.status(500).json({ success: false, message });
    }
  }

  async getStudentStats(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const stats = await assignmentService.getStudentAssignmentStats(parseInt(studentId, 10));
      res.json({ success: true, data: stats });
    } catch (error) {
      log("error", "dashboard.assignments.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to fetch stats";
      res.status(500).json({ success: false, message });
    }
  }

  async getSlotStats(req: Request, res: Response): Promise<void> {
    try {
      const { slotId } = req.params;
      const stats = await assignmentService.getSlotSubmissionStats(parseInt(slotId, 10));
      res.json({ success: true, data: stats });
    } catch (error) {
      log("error", "dashboard.assignments.json failed", { err: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "Failed to fetch stats";
      res.status(500).json({ success: false, message });
    }
  }
}

export const assignmentController = new AssignmentController();
