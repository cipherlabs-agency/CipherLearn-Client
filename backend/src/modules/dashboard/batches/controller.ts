import type { Request, Response } from "express";
import { Prisma, User } from "../../../../prisma/generated/prisma/client";
import BatchService from "./service";

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

      const created = await batchService.create({
        name,
        timings,
        totalStudents: totalStudents ?? 0,
      } as Prisma.BatchCreateInput);

      return res
        .status(201)
        .json({ success: true, message: "Batch created", batch: created });
    } catch (error) {
      console.error("Batch.create error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Create failed: ${error}` });
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const idParam = req.params.id || req.body.id;
      if (!idParam)
        return res
          .status(400)
          .json({ success: false, message: "id is required" });

      const id = Number(idParam);
      if (Number.isNaN(id))
        return res
          .status(400)
          .json({ success: false, message: "id must be a number" });

      const { name, timings, totalStudents } =
        req.body as Partial<Prisma.BatchCreateInput>;

      const updated = await batchService.update({
        id,
        name,
        timings,
        totalStudents,
      } as Prisma.BatchCreateInput);

      return res
        .status(200)
        .json({ success: true, message: "Batch updated", batch: updated });
    } catch (error) {
      console.error("Batch.update error:", error);
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
      const batches = await batchService.get();
      return res.status(200).json({ success: true, batches });
    } catch (error) {
      console.error("Batch.getAll error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Get failed: ${error}` });
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
      return res
        .status(200)
        .json({ success: true, message: "Batches drafted", result });
    } catch (error) {
      console.error("Batch.draft error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Draft failed: ${error}` });
    }
  }

  public async getDrafts(req: Request, res: Response) {
    try {
      const drafts = await batchService.getDrafts();
      return res.status(200).json({ success: true, drafts });
    } catch (error) {
      console.error("Batch.getDrafts error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Get drafts failed: ${error}` });
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
      return res
        .status(200)
        .json({ success: true, message: "Batches deleted", result });
    } catch (error) {
      console.error("Batch.delete error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Delete failed: ${error}` });
    }
  }
}
