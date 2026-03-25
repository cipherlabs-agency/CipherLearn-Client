import { Prisma, Batch } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import { cacheService } from "../../../cache";
import { DashboardKeys } from "../../../cache/keys";
import * as TTL from "../../../cache/ttl";
import { invalidateAfterBatchMutation } from "../../../cache/invalidation";
import { log } from "../../../utils/logtail";

export default class BatchService {
  async create(batch: Prisma.BatchCreateInput): Promise<Batch> {
    try {
      const newBatch = await prisma.batch.create({
        data: {
          name: batch.name,
          timings: batch.timings,
          totalStudents: batch.totalStudents,
        },
      });

      invalidateAfterBatchMutation();
      return newBatch;
    } catch (error) {
      log("error", "dashboard.batches.invalidateAfterBatchMutation failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async update(id: number, batch: Prisma.BatchUpdateInput): Promise<Batch> {
    try {
      let exist = await prisma.batch.findUnique({
        where: { id: id },
      });

      if (!exist) throw new Error("Batch not found");

      const updated = await prisma.batch.update({
        where: { id: id },
        data: {
          ...batch,
        },
      });

      invalidateAfterBatchMutation(id);
      return updated;
    } catch (error) {
      log("error", "dashboard.batches.invalidateAfterBatchMutation failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async getAll() {
    return cacheService.getOrSet(
      DashboardKeys.batchList(),
      async () => {
        const batches = await prisma.batch.findMany({
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            timings: true,
            totalStudents: true,
            createdAt: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        });
        return batches;
      },
      TTL.BATCH_LIST
    );
  }

  async getById(id: number) {
    return cacheService.getOrSet(
      DashboardKeys.batchDetail(id),
      async () => {
        const batch = await prisma.batch.findUnique({
          where: { id: id, isDeleted: false },
        });

        if (!batch) throw new Error("Batch not found");
        return batch;
      },
      TTL.BATCH_DETAIL
    );
  }

  async draft(ids: number[], user: { name: string }) {
    try {
      const drafts = await prisma.batch.updateMany({
        where: { id: { in: ids } },
        data: {
          isDeleted: true,
          deletedBy: user.name,
        },
      });

      invalidateAfterBatchMutation();
      return !!drafts;
    } catch (error) {
      log("error", "dashboard.batches.invalidateAfterBatchMutation failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async getDrafts() {
    try {
      return cacheService.getOrSet(
        DashboardKeys.batchDrafts(),
        () => prisma.batch.findMany({ where: { isDeleted: true } }),
        TTL.BATCH_DRAFTS
      );
    } catch (error) {
      log("error", "dashboard.batches.findMany failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Restore soft-deleted batches
   */
  async restore(ids: number[]): Promise<{ restored: number }> {
    try {
      const result = await prisma.batch.updateMany({
        where: {
          id: { in: ids },
          isDeleted: true,
        },
        data: {
          isDeleted: false,
          deletedBy: null,
        },
      });

      invalidateAfterBatchMutation();
      return { restored: result.count };
    } catch (error) {
      log("error", "dashboard.batches.invalidateAfterBatchMutation failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Soft delete batches (sets isDeleted to true)
   * This is the same as draft but without tracking who deleted it
   */
  async delete(ids: number[]) {
    try {
      const deleted = await prisma.batch.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          isDeleted: true,
        },
      });

      invalidateAfterBatchMutation();
      return !!deleted;
    } catch (error) {
      log("error", "dashboard.batches.invalidateAfterBatchMutation failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // =====================
  // DANGER ZONE - HARD DELETE OPERATIONS
  // =====================

  /**
   * Permanently delete a batch with all related data (DANGER: This cannot be undone!)
   */
  async hardDelete(id: number): Promise<{ deleted: boolean; relatedData: { students: number; attendance: number; sheets: number; videos: number; notes: number; qrTokens: number; feeReceipts: number; feeStructures: number; assignments: number; studyMaterials: number } }> {
    try {
      // Delete related QR tokens
      const qrTokens = await prisma.qRAttendanceToken.deleteMany({
        where: { batchId: id },
      });

      // Delete related attendance records first (references sheets)
      const attendance = await prisma.attendance.deleteMany({
        where: { batchId: id },
      });

      // Delete related attendance sheets
      const sheets = await prisma.attendanceSheet.deleteMany({
        where: { batchId: id },
      });

      // Delete fee receipts (references students and fee structures)
      const feeReceipts = await prisma.feeReceipt.deleteMany({
        where: { batchId: id },
      });

      // Delete fee structures
      const feeStructures = await prisma.feeStructure.deleteMany({
        where: { batchId: id },
      });

      // Delete related notes
      const notes = await prisma.note.deleteMany({
        where: { batchId: id },
      });

      // Delete related videos
      const videos = await prisma.youtubeVideo.deleteMany({
        where: { batchId: id },
      });

      // Delete assignment submissions first (references assignmentSlot)
      const assignmentSlotIds = await prisma.assignmentSlot.findMany({
        where: { batchId: id },
        select: { id: true },
      });
      await prisma.studentSubmission.deleteMany({
        where: { slotId: { in: assignmentSlotIds.map(a => a.id) } },
      });

      // Delete assignments
      const assignments = await prisma.assignmentSlot.deleteMany({
        where: { batchId: id },
      });

      // Delete study materials
      const studyMaterials = await prisma.studyMaterial.deleteMany({
        where: { batchId: id },
      });

      // Delete related students
      const students = await prisma.student.deleteMany({
        where: { batchId: id },
      });

      // Finally delete the batch
      await prisma.batch.delete({
        where: { id },
      });

      cacheService.flush();

      return {
        deleted: true,
        relatedData: {
          students: students.count,
          attendance: attendance.count,
          sheets: sheets.count,
          videos: videos.count,
          notes: notes.count,
          qrTokens: qrTokens.count,
          feeReceipts: feeReceipts.count,
          feeStructures: feeStructures.count,
          assignments: assignments.count,
          studyMaterials: studyMaterials.count,
        },
      };
    } catch (error) {
      log("error", "dashboard.batches.flush failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Purge all soft-deleted batches with related data (DANGER: This cannot be undone!)
   */
  async purgeDeleted(): Promise<{ deleted: number }> {
    try {
      const deletedBatches = await prisma.batch.findMany({
        where: { isDeleted: true },
        select: { id: true },
      });

      const ids = deletedBatches.map((b) => b.id);

      if (ids.length === 0) {
        return { deleted: 0 };
      }

      // Delete all related data in correct order (respecting foreign keys)
      await prisma.qRAttendanceToken.deleteMany({
        where: { batchId: { in: ids } },
      });
      await prisma.attendance.deleteMany({
        where: { batchId: { in: ids } },
      });
      await prisma.attendanceSheet.deleteMany({
        where: { batchId: { in: ids } },
      });
      await prisma.feeReceipt.deleteMany({
        where: { batchId: { in: ids } },
      });
      await prisma.feeStructure.deleteMany({
        where: { batchId: { in: ids } },
      });
      await prisma.note.deleteMany({
        where: { batchId: { in: ids } },
      });
      await prisma.youtubeVideo.deleteMany({
        where: { batchId: { in: ids } },
      });
      // Delete assignment submissions first
      const assignmentSlotIds = await prisma.assignmentSlot.findMany({
        where: { batchId: { in: ids } },
        select: { id: true },
      });
      await prisma.studentSubmission.deleteMany({
        where: { slotId: { in: assignmentSlotIds.map(a => a.id) } },
      });
      await prisma.assignmentSlot.deleteMany({
        where: { batchId: { in: ids } },
      });
      await prisma.studyMaterial.deleteMany({
        where: { batchId: { in: ids } },
      });
      await prisma.student.deleteMany({
        where: { batchId: { in: ids } },
      });

      const result = await prisma.batch.deleteMany({
        where: { id: { in: ids } },
      });

      cacheService.flush();

      return { deleted: result.count };
    } catch (error) {
      log("error", "dashboard.batches.flush failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
