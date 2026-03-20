import type { Request, Response } from "express";
import { User } from "../../../../prisma/generated/prisma/client";
import FeesService from "./service";
import { generateReceiptPDF, type InstitutionInfo } from "./pdf.service";
import { settingsService } from "../settings/service";
import { config } from "../../../config/env.config";
import logger from "../../../utils/logger";
import {
  validate,
  createFeeStructureSchema,
  updateFeeStructureSchema,
  createFeeReceiptSchema,
  updateFeeReceiptSchema,
  bulkCreateReceiptsSchema,
  feeReceiptFiltersSchema,
} from "./validation";
import {
  CreateFeeStructureInput,
  UpdateFeeStructureInput,
  CreateFeeReceiptInput,
  UpdateFeeReceiptInput,
  BulkCreateReceiptsInput,
  FeeReceiptFilters,
} from "./types";
import { log } from "../../../utils/logtail";

const feesService = new FeesService();

export default class FeesController {
  // ============================================
  // Fee Structure Endpoints
  // ============================================

  /**
   * Create a new fee structure
   * POST /fees/structures
   */
  public async createFeeStructure(req: Request, res: Response) {
    try {
      const { value, error } = validate<CreateFeeStructureInput>(createFeeStructureSchema, req.body);

      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      const structure = await feesService.createFeeStructure(value);

      logger.info(`Fee structure created: ${structure.name} for batch ${structure.batchId}`);

      return res.status(201).json({
        success: true,
        message: "Fee structure created successfully",
        data: structure,
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err) });
      logger.error("FeesController.createFeeStructure error:", err);

      if (err.message.includes("not found")) {
        return res.status(404).json({ success: false, message: err.message });
      }
      if (err.message.includes("already exists")) {
        return res.status(409).json({ success: false, message: err.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to create fee structure: ${err.message}`,
      });
    }
  }

  /**
   * Get fee structures for a batch
   * GET /fees/structures/batch/:batchId
   */
  public async getFeeStructuresByBatch(req: Request, res: Response) {
    try {
      const batchId = parseInt(req.params.batchId, 10);

      if (isNaN(batchId)) {
        return res.status(400).json({ success: false, message: "Invalid batch ID" });
      }

      const structures = await feesService.getFeeStructuresByBatch(batchId);

      return res.status(200).json({
        success: true,
        data: structures,
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err) });
      logger.error("FeesController.getFeeStructuresByBatch error:", err);

      return res.status(500).json({
        success: false,
        message: `Failed to get fee structures: ${err.message}`,
      });
    }
  }

  /**
   * Update a fee structure
   * PUT /fees/structures/:id
   */
  public async updateFeeStructure(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      const { value, error } = validate<UpdateFeeStructureInput>(updateFeeStructureSchema, req.body);

      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      const structure = await feesService.updateFeeStructure(id, value);

      logger.info(`Fee structure updated: ${structure.id}`);

      return res.status(200).json({
        success: true,
        message: "Fee structure updated successfully",
        data: structure,
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err) });
      logger.error("FeesController.updateFeeStructure error:", err);

      if (err.message.includes("not found")) {
        return res.status(404).json({ success: false, message: err.message });
      }
      if (err.message.includes("already exists")) {
        return res.status(409).json({ success: false, message: err.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to update fee structure: ${err.message}`,
      });
    }
  }

  /**
   * Delete a fee structure
   * DELETE /fees/structures/:id
   */
  public async deleteFeeStructure(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      await feesService.deleteFeeStructure(id);

      logger.info(`Fee structure deleted: ${id}`);

      return res.status(200).json({
        success: true,
        message: "Fee structure deleted successfully",
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err) });
      logger.error("FeesController.deleteFeeStructure error:", err);

      if (err.message.includes("not found")) {
        return res.status(404).json({ success: false, message: err.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to delete fee structure: ${err.message}`,
      });
    }
  }

  // ============================================
  // Fee Receipt Endpoints
  // ============================================

  /**
   * Create a single fee receipt
   * POST /fees/receipts
   */
  public async createReceipt(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const { value, error } = validate<CreateFeeReceiptInput>(createFeeReceiptSchema, req.body);

      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      const receipt = await feesService.createReceipt({
        ...value,
        generatedBy: user.name,
        generatedById: user.id,
      });

      logger.info(`Fee receipt created: ${receipt.receiptNumber}`);

      return res.status(201).json({
        success: true,
        message: "Fee receipt created successfully",
        data: receipt,
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err), userId: req.user?.id });
      logger.error("FeesController.createReceipt error:", err);

      if (err.message.includes("not found")) {
        return res.status(404).json({ success: false, message: err.message });
      }
      if (err.message.includes("already exists")) {
        return res.status(409).json({ success: false, message: err.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to create receipt: ${err.message}`,
      });
    }
  }

  /**
   * Bulk create receipts for a batch
   * POST /fees/receipts/bulk
   */
  public async bulkCreateReceipts(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const { value, error } = validate<BulkCreateReceiptsInput>(bulkCreateReceiptsSchema, req.body);

      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      const result = await feesService.bulkCreateReceipts({
        ...value,
        generatedBy: user.name,
        generatedById: user.id,
      });

      logger.info(`Bulk receipts created: ${result.created}/${result.total}`);

      return res.status(201).json({
        success: true,
        message: `Created ${result.created} receipts (${result.skipped} skipped)`,
        data: result,
      });
    } catch (err: any) {
      log("error", "dashboard.fees.receipts failed", { err: err instanceof Error ? err.message : String(err), userId: req.user?.id });
      logger.error("FeesController.bulkCreateReceipts error:", err);

      if (err.message.includes("not found")) {
        return res.status(404).json({ success: false, message: err.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to create receipts: ${err.message}`,
      });
    }
  }

  /**
   * Get all receipts with filters
   * GET /fees/receipts
   */
  public async getReceipts(req: Request, res: Response) {
    try {
      const { value, error } = validate<FeeReceiptFilters & { page?: number; limit?: number }>(
        feeReceiptFiltersSchema,
        req.query
      );

      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      const { page = 1, limit = 20, ...filters } = value;
      const result = await feesService.getReceipts(filters, page, limit);

      return res.status(200).json({
        success: true,
        data: result.receipts,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err) });
      logger.error("FeesController.getReceipts error:", err);

      return res.status(500).json({
        success: false,
        message: `Failed to get receipts: ${err.message}`,
      });
    }
  }

  /**
   * Get a single receipt by ID
   * GET /fees/receipts/:id
   */
  public async getReceiptById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      const receipt = await feesService.getReceiptById(id);

      return res.status(200).json({
        success: true,
        data: receipt,
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err) });
      logger.error("FeesController.getReceiptById error:", err);

      if (err.message.includes("not found")) {
        return res.status(404).json({ success: false, message: err.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to get receipt: ${err.message}`,
      });
    }
  }

  /**
   * Update a receipt
   * PUT /fees/receipts/:id
   */
  public async updateReceipt(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      const { value, error } = validate<UpdateFeeReceiptInput>(updateFeeReceiptSchema, req.body);

      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      const receipt = await feesService.updateReceipt(id, {
        ...value,
        modifiedBy: user.name,
        modifiedById: user.id,
      });

      logger.info(`Fee receipt updated: ${receipt.receiptNumber}`);

      return res.status(200).json({
        success: true,
        message: "Receipt updated successfully",
        data: receipt,
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err), userId: req.user?.id });
      logger.error("FeesController.updateReceipt error:", err);

      if (err.message.includes("not found")) {
        return res.status(404).json({ success: false, message: err.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to update receipt: ${err.message}`,
      });
    }
  }

  /**
   * Delete a receipt
   * DELETE /fees/receipts/:id
   */
  public async deleteReceipt(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      await feesService.deleteReceipt(id);

      logger.info(`Fee receipt deleted: ${id}`);

      return res.status(200).json({
        success: true,
        message: "Receipt deleted successfully",
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err) });
      logger.error("FeesController.deleteReceipt error:", err);

      if (err.message.includes("not found")) {
        return res.status(404).json({ success: false, message: err.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to delete receipt: ${err.message}`,
      });
    }
  }

  // ============================================
  // Summary & Reports
  // ============================================

  /**
   * Get receipts summary
   * GET /fees/receipts/summary
   */
  public async getReceiptsSummary(req: Request, res: Response) {
    try {
      const filters: FeeReceiptFilters = {
        batchId: req.query.batchId ? parseInt(req.query.batchId as string, 10) : undefined,
        studentId: req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined,
        academicYear: req.query.academicYear ? parseInt(req.query.academicYear as string, 10) : undefined,
      };

      const summary = await feesService.getReceiptsSummary(filters);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err) });
      logger.error("FeesController.getReceiptsSummary error:", err);

      return res.status(500).json({
        success: false,
        message: `Failed to get summary: ${err.message}`,
      });
    }
  }

  /**
   * Get student fees summary
   * GET /fees/student/:studentId/summary
   */
  public async getStudentFeesSummary(req: Request, res: Response) {
    try {
      const studentId = parseInt(req.params.studentId, 10);

      if (isNaN(studentId)) {
        return res.status(400).json({ success: false, message: "Invalid student ID" });
      }

      const summary = await feesService.getStudentFeesSummary(studentId);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err) });
      logger.error("FeesController.getStudentFeesSummary error:", err);

      if (err.message.includes("not found")) {
        return res.status(404).json({ success: false, message: err.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to get student summary: ${err.message}`,
      });
    }
  }

  // ============================================
  // PDF Generation
  // ============================================

  /**
   * Download receipt as PDF
   * GET /fees/receipts/:id/pdf
   */
  public async downloadReceiptPDF(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      const receipt = await feesService.getReceiptById(id);

      // Build institution info from class settings + env branding
      const settings = await settingsService.getSettings();
      const institution: InstitutionInfo = {
        name: settings.className || config.CLASS.NAME,
        address: settings.classAddress || "",
        phone: settings.classPhone || "",
        email: settings.classEmail || "",
        website: settings.classWebsite || "",
        primaryColor: config.CLASS.PRIMARY_COLOR,
      };

      // Generate PDF
      const doc = generateReceiptPDF(receipt, institution);

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Receipt-${receipt.receiptNumber}.pdf"`
      );

      // Pipe PDF to response
      doc.pipe(res);
      doc.end();

      logger.info(`PDF generated for receipt: ${receipt.receiptNumber}`);
    } catch (err: any) {
      log("error", "dashboard.fees.info failed", { err: err instanceof Error ? err.message : String(err) });
      logger.error("FeesController.downloadReceiptPDF error:", err);

      if (err.message.includes("not found")) {
        return res.status(404).json({ success: false, message: err.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to generate PDF: ${err.message}`,
      });
    }
  }

  // ============================================
  // Student-facing Endpoints
  // ============================================

  /**
   * Get my receipts (for authenticated student)
   * GET /fees/my-receipts
   */
  public async getMyReceipts(req: Request, res: Response) {
    try {
      const user = req.user as User;

      // First find the student by email
      const { prisma } = await import("../../../config/db.config");
      const student = await prisma.student.findUnique({
        where: { email: user.email, isDeleted: false },
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "No student profile found for your account",
        });
      }

      const receipts = await feesService.getStudentReceipts(student.id);

      return res.status(200).json({
        success: true,
        data: receipts,
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err), userId: req.user?.id });
      logger.error("FeesController.getMyReceipts error:", err);

      return res.status(500).json({
        success: false,
        message: `Failed to get your receipts: ${err.message}`,
      });
    }
  }

  /**
   * Get my fees summary (for authenticated student)
   * GET /fees/my-summary
   */
  public async getMySummary(req: Request, res: Response) {
    try {
      const user = req.user as User;

      // First find the student by email
      const { prisma } = await import("../../../config/db.config");
      const student = await prisma.student.findUnique({
        where: { email: user.email, isDeleted: false },
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "No student profile found for your account",
        });
      }

      const summary = await feesService.getStudentFeesSummary(student.id);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err: any) {
      log("error", "dashboard.fees.status failed", { err: err instanceof Error ? err.message : String(err), userId: req.user?.id });
      logger.error("FeesController.getMySummary error:", err);

      return res.status(500).json({
        success: false,
        message: `Failed to get your summary: ${err.message}`,
      });
    }
  }
}
