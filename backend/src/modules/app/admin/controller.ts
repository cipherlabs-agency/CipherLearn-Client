import type { Request, Response } from "express";
import logger from "../../../utils/logger";
import * as adminService from "./service";

export default class AppAdminController {
  // ─── BATCHES ────────────────────────────────────────────────────────────────

  async listBatches(req: Request, res: Response) {
    try {
      const data = await adminService.listBatches();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.listBatches error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBatch(req: Request, res: Response) {
    try {
      const data = await adminService.getBatchById(Number(req.params.id));
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.getBatch error:", error);
      return res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  async createBatch(req: Request, res: Response) {
    try {
      const data = await adminService.createBatch(req.body);
      return res.status(201).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.createBatch error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateBatch(req: Request, res: Response) {
    try {
      const data = await adminService.updateBatch(Number(req.params.id), req.body);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.updateBatch error:", error);
      return res.status(error.message.includes("not found") ? 404 : 400).json({ success: false, message: error.message });
    }
  }

  async deleteBatch(req: Request, res: Response) {
    try {
      await adminService.deleteBatch(Number(req.params.id));
      return res.status(200).json({ success: true, message: "Batch deleted" });
    } catch (error: any) {
      logger.error("AppAdmin.deleteBatch error:", error);
      return res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  // ─── STUDENTS ───────────────────────────────────────────────────────────────

  async listStudents(req: Request, res: Response) {
    try {
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = Math.min(req.query.limit ? Number(req.query.limit) : 20, 100);
      const result = await adminService.listStudents({ batchId, search, page, limit });
      return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      logger.error("AppAdmin.listStudents error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStudent(req: Request, res: Response) {
    try {
      const data = await adminService.getStudentById(Number(req.params.id));
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.getStudent error:", error);
      return res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  async enrollStudent(req: Request, res: Response) {
    try {
      const data = await adminService.enrollStudent(req.body);
      return res.status(201).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.enrollStudent error:", error);
      const status = error.message.includes("already exists") ? 409 : error.message.includes("not found") ? 404 : 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  async updateStudent(req: Request, res: Response) {
    try {
      const data = await adminService.updateStudent(Number(req.params.id), req.body);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.updateStudent error:", error);
      return res.status(error.message.includes("not found") ? 404 : 400).json({ success: false, message: error.message });
    }
  }

  async deleteStudent(req: Request, res: Response) {
    try {
      await adminService.deleteStudent(Number(req.params.id));
      return res.status(200).json({ success: true, message: "Student deleted" });
    } catch (error: any) {
      logger.error("AppAdmin.deleteStudent error:", error);
      return res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  // ─── TEACHERS ───────────────────────────────────────────────────────────────

  async listTeachers(req: Request, res: Response) {
    try {
      const search = req.query.search as string | undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = Math.min(req.query.limit ? Number(req.query.limit) : 20, 100);
      const result = await adminService.listTeachers({ search, page, limit });
      return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      logger.error("AppAdmin.listTeachers error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTeacher(req: Request, res: Response) {
    try {
      const data = await adminService.getTeacherById(Number(req.params.id));
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.getTeacher error:", error);
      return res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  async createTeacher(req: Request, res: Response) {
    try {
      const data = await adminService.createTeacher(req.body);
      return res.status(201).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.createTeacher error:", error);
      return res.status(error.message.includes("already exists") ? 409 : 400).json({ success: false, message: error.message });
    }
  }

  async updateTeacher(req: Request, res: Response) {
    try {
      const data = await adminService.updateTeacher(Number(req.params.id), req.body);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.updateTeacher error:", error);
      return res.status(error.message.includes("not found") ? 404 : 400).json({ success: false, message: error.message });
    }
  }

  async deleteTeacher(req: Request, res: Response) {
    try {
      await adminService.deleteTeacher(Number(req.params.id));
      return res.status(200).json({ success: true, message: "Teacher account deactivated" });
    } catch (error: any) {
      logger.error("AppAdmin.deleteTeacher error:", error);
      return res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  // ─── FEE STRUCTURES ─────────────────────────────────────────────────────────

  async listFeeStructures(req: Request, res: Response) {
    try {
      const batchId = Number(req.query.batchId);
      if (isNaN(batchId) || batchId < 1) {
        return res.status(400).json({ success: false, message: "batchId query param is required" });
      }
      const data = await adminService.listFeeStructures(batchId);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.listFeeStructures error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createFeeStructure(req: Request, res: Response) {
    try {
      const data = await adminService.createFeeStructure(req.body);
      return res.status(201).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.createFeeStructure error:", error);
      return res.status(error.message.includes("already exists") ? 409 : 400).json({ success: false, message: error.message });
    }
  }

  async updateFeeStructure(req: Request, res: Response) {
    try {
      const data = await adminService.updateFeeStructure(Number(req.params.id), req.body);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error("AppAdmin.updateFeeStructure error:", error);
      return res.status(error.message.includes("not found") ? 404 : 400).json({ success: false, message: error.message });
    }
  }

  async deleteFeeStructure(req: Request, res: Response) {
    try {
      await adminService.deleteFeeStructure(Number(req.params.id));
      return res.status(200).json({ success: true, message: "Fee structure deactivated" });
    } catch (error: any) {
      logger.error("AppAdmin.deleteFeeStructure error:", error);
      return res.status(error.message.includes("not found") ? 404 : 500).json({ success: false, message: error.message });
    }
  }
}
