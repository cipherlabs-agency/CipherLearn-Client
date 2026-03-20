import type { Request, Response } from "express";
import { Prisma, User } from "../../../../prisma/generated/prisma/client";
import BatchService from "./service";
import logger from "../../../utils/logger";
import { log } from "../../../utils/logtail";

const batchService = new BatchService();

export default class BatchController {
  public async create(req: Request, res: Response) {
    try {
      const { name, timings, totalStudents } =
        req.body as Partial<Prisma.BatchCreateInput>;

      if (!name || !timings)
        return res
          .status(400)
          .json({ success: false, message: "name and timings are required" });

      let capacity = 0;
      if (typeof totalStudents === "object" && totalStudents !== null) {
        capacity = (totalStudents as any).capacity || 0;
      } else if (typeof totalStudents === "number") {
        capacity = totalStudents;
      }

      const created = await batchService.create({
        name,
        timings,
        totalStudents: capacity,
      } as Prisma.BatchCreateInput);

      logger.info(`Batch created: ${created.name}`);

      return res
        .status(201)
        .json({ success: true, message: "Batch created", data: created });
    } catch (error) {
      log("error", "dashboard.batches.json failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("Batch.create error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Create failed: ${error}` });
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const batch = req.body as Partial<Prisma.BatchUpdateInput>;

      const updated = await batchService.update(Number(id), batch);

      logger.info(`Batch updated: ${updated.id}`);

      return res
        .status(200)
        .json({ success: true, message: "Batch updated", data: updated });
    } catch (error) {
      log("error", "dashboard.batches.json failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("Batch.update error:", error);
      if ((error as Error).message?.includes("not found"))
        return res
          .status(404)
          .json({ success: false, message: (error as Error).message });
      return res
        .status(500)
        .json({ success: false, message: `Update failed: ${error}` });
    }
  }

  public async getAll(req: Request, res: Response) {
    try {
      const batches = await batchService.getAll();

      const formattedBatches = batches.map((batch: any) => {
        const capacity = typeof batch.totalStudents === 'number'
          ? batch.totalStudents
          : (batch.totalStudents as any)?.capacity || 0;
        const enrolled = batch._count?.students || 0;

        return {
          id: batch.id,
          name: batch.name,
          timings: batch.timings,
          createdAt: batch.createdAt,
          // Return totalStudents as object with both capacity and enrolled
          totalStudents: {
            capacity,
            enrolled,
          },
          // Keep legacy fields for compatibility
          students: enrolled,
          time: batch.timings?.time || "",
          days: Array.isArray(batch.timings?.days)
            ? batch.timings.days.join(", ")
            : "",
          status: "Active",
        };
      });

      return res.status(200).json({ success: true, batches: formattedBatches });
    } catch (error) {
      log("error", "dashboard.batches.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("Batch.getAll error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Get failed: ${error}` });
    }
  }

  public async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const batch = await batchService.getById(Number(id));
      return res.status(200).json({ success: true, data: batch });
    } catch (error) {
      log("error", "dashboard.batches.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("Batch.get error:", error);
      return res
        .status(404)
        .json({ success: false, message: (error as Error).message });
    }
  }

  public async draft(req: Request, res: Response) {
    try {
      const ids = (req.body.ids || []) as number[];
      if (!Array.isArray(ids) || ids.length === 0)
        return res
          .status(400)
          .json({ success: false, message: "ids array is required" });

      const user = req.user as User;

      const result = await batchService.draft(ids, user);
      logger.info(`Batches drafted: ${ids.join(", ")}`);
      return res
        .status(200)
        .json({ success: true, message: "Batches drafted", result });
    } catch (error) {
      log("error", "dashboard.batches.json failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("Batch.draft error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Draft failed: ${error}` });
    }
  }

  public async getDrafts(req: Request, res: Response) {
    try {
      const drafts = await batchService.getDrafts();
      return res.status(200).json({ success: true, batches: drafts });
    } catch (error) {
      log("error", "dashboard.batches.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("Batch.getDrafts error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Get drafts failed: ${error}` });
    }
  }

  /**
   * Restore soft-deleted batches
   * PUT /batches/restore
   */
  public async restore(req: Request, res: Response) {
    try {
      const ids = (req.body.ids || []) as number[];
      if (!Array.isArray(ids) || ids.length === 0)
        return res
          .status(400)
          .json({ success: false, message: "ids array is required" });

      const result = await batchService.restore(ids);
      logger.info(`Batches restored: ${ids.join(", ")}`);
      return res
        .status(200)
        .json({ success: true, message: "Batches restored", data: result });
    } catch (error) {
      log("error", "dashboard.batches.json failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("Batch.restore error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Restore failed: ${error}` });
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const ids = (req.body.ids || []) as number[];
      if (!Array.isArray(ids) || ids.length === 0)
        return res
          .status(400)
          .json({ success: false, message: "ids array is required" });

      const result = await batchService.delete(ids);
      logger.info(`Batches deleted: ${ids.join(", ")}`);
      return res
        .status(200)
        .json({ success: true, message: "Batches deleted", result });
    } catch (error) {
      log("error", "dashboard.batches.json failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("Batch.delete error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Delete failed: ${error}` });
    }
  }

  // =====================
  // DANGER ZONE - HARD DELETE OPERATIONS
  // =====================

  /**
   * Permanently delete a batch with all related data
   * DELETE /batches/hard-delete/:id
   */
  public async hardDelete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await batchService.hardDelete(Number(id));

      logger.warn(`DANGER ZONE: Batch ${id} permanently deleted with all related data by ${req.user?.name}`);

      return res.status(200).json({
        success: true,
        message: "Batch and all related data permanently deleted",
        data: result,
      });
    } catch (error) {
      log("error", "dashboard.batches.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("Batch.hardDelete error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to permanently delete batch: ${error}`,
      });
    }
  }

  /**
   * Purge all soft-deleted batches with related data
   * DELETE /batches/purge-deleted
   */
  public async purgeDeleted(req: Request, res: Response) {
    try {
      const result = await batchService.purgeDeleted();

      logger.warn(`DANGER ZONE: ${result.deleted} soft-deleted batches purged by ${req.user?.name}`);

      return res.status(200).json({
        success: true,
        message: `${result.deleted} soft-deleted batches permanently removed`,
        data: result,
      });
    } catch (error) {
      log("error", "dashboard.batches.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("Batch.purgeDeleted error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to purge deleted batches: ${error}`,
      });
    }
  }
}
