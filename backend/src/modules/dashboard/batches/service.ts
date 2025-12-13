import { Prisma } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";

export default class BatchService {
  async create(
    batch: Prisma.BatchCreateInput
  ): Promise<
    Omit<
      Prisma.BatchCreateInput,
      "id" | "isDeleted" | "deletedBy" | "createdBy" | "updatedBy"
    >
  > {
    try {
      const newBatch = await prisma.batch.create({
        data: {
          name: batch.name,
          timings: batch.timings,
          totalStudents: batch.totalStudents,
        },
      });

      return newBatch as Prisma.BatchCreateInput;
    } catch (error) {
      throw error;
    }
  }

  async update(
    batch: Prisma.BatchCreateInput
  ): Promise<Omit<Prisma.BatchCreateInput, "id" | "createdAt">> {
    try {
      let exist = await prisma.batch.findUnique({
        where: { id: batch.id },
      });

      if (!exist) throw new Error("Batch not found");

      const updated = await prisma.batch.update({
        where: { id: batch.id },
        data: {
          ...batch,
        },
      });

      return updated as Prisma.BatchCreateInput;
    } catch (error) {
      throw error;
    }
  }

  async get() {
    try {
      const batches = await prisma.batch.findMany();
      return batches;
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

  async promote() {}
}
