import type { Request, Response } from "express";
import TeacherService from "./service";
import logger from "../../../utils/logger";
import { CreateTeacherInput, UpdateTeacherInput } from "./types";
import { log } from "../../../utils/logtail";

const teacherService = new TeacherService();

export default class TeacherController {
  /**
   * Create a new teacher
   * POST /dashboard/teachers
   */
  public async create(req: Request, res: Response) {
    try {
      const { name, email }: CreateTeacherInput = req.body;

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: "Name and email are required",
        });
      }

      const teacher = await teacherService.create({ name, email });

      logger.info(`Teacher created: ${teacher.email}`);

      return res.status(201).json({
        success: true,
        message: "Teacher created successfully",
        data: teacher,
      });
    } catch (error: any) {
      log("error", "dashboard.teachers.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("TeacherController.create error:", error);

      if (error.message.includes("already exists")) {
        return res.status(409).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to create teacher: ${error.message}`,
      });
    }
  }

  /**
   * Get all teachers
   * GET /dashboard/teachers
   */
  public async getAll(req: Request, res: Response) {
    try {
      const teachers = await teacherService.getAll();

      return res.status(200).json({
        success: true,
        data: teachers,
      });
    } catch (error: any) {
      log("error", "dashboard.teachers.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("TeacherController.getAll error:", error);

      return res.status(500).json({
        success: false,
        message: `Failed to fetch teachers: ${error.message}`,
      });
    }
  }

  /**
   * Get a single teacher by ID
   * GET /dashboard/teachers/:id
   */
  public async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const teacher = await teacherService.getById(Number(id));

      return res.status(200).json({
        success: true,
        data: teacher,
      });
    } catch (error: any) {
      log("error", "dashboard.teachers.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("TeacherController.getById error:", error);

      if (error.message === "Teacher not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to fetch teacher: ${error.message}`,
      });
    }
  }

  /**
   * Update a teacher
   * PUT /dashboard/teachers/:id
   */
  public async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateTeacherInput = req.body;

      const teacher = await teacherService.update(Number(id), data);

      logger.info(`Teacher updated: ${teacher.email}`);

      return res.status(200).json({
        success: true,
        message: "Teacher updated successfully",
        data: teacher,
      });
    } catch (error: any) {
      log("error", "dashboard.teachers.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("TeacherController.update error:", error);

      if (error.message === "Teacher not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      if (error.message.includes("already exists")) {
        return res.status(409).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to update teacher: ${error.message}`,
      });
    }
  }

  /**
   * Delete a teacher
   * DELETE /dashboard/teachers/:id
   */
  public async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await teacherService.delete(Number(id));

      logger.info(`Teacher deleted: ID ${id} by ${req.user?.name}`);

      return res.status(200).json({
        success: true,
        message: "Teacher deleted successfully",
      });
    } catch (error: any) {
      log("error", "dashboard.teachers.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("TeacherController.delete error:", error);

      if (error.message === "Teacher not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to delete teacher: ${error.message}`,
      });
    }
  }
}
