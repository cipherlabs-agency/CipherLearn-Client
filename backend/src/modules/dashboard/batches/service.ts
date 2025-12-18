import { Prisma, Batch } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";

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

      return newBatch;
    } catch (error) {
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

      return updated;
    } catch (error) {
      throw error;
    }
  }

  async getAll() {
    try {
      let select: Prisma.BatchSelect = {
        id: true,
        name: true,
        timings: true,
        totalStudents: true,
        createdAt: true,
      };

      const batches = await prisma.batch.findMany({
        where: { isDeleted: false },
        select: select,
      });
      return batches;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: number) {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id: id, isDeleted: false },
      });

      if (!batch) throw new Error("Batch not found");
      return batch;
    } catch (error) {
      throw error;
    }
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

      return !!drafts;
    } catch (error) {
      throw error;
    }
  }

  async getDrafts() {
    try {
      const drafts = await prisma.batch.findMany({
        where: {
          isDeleted: true,
        },
      });

      return drafts;
    } catch (error) {
      throw error;
    }
  }

  async delete(ids: number[]) {
    try {
      const deleted = await prisma.batch.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      return !!deleted;
    } catch (error) {
      throw error;
    }
  }
}
