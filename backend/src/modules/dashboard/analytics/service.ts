import { AttendanceStatus } from "../../../../prisma/generated/prisma/enums";
import { prisma } from "../../../config/db.config";

export default class AnalyticsService {
  async getTotalStudentsCountOfBatch(batchId: number): Promise<number> {
    try {
      let batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: {
          _count: {
            select: { students: true },
          },
        },
      });

      if (!batch) {
        throw new Error("Batch not found");
      }
      return batch._count.students;
    } catch (error) {
      throw error;
    }
  }

  async getTotalStudentsCount(): Promise<number> {
    try {
      const count = await prisma.student.count();
      return count;
    } catch (error) {
      throw error;
    }
  }

  async getTotalBatchesCount(): Promise<number> {
    try {
      const count = await prisma.batch.count();
      return count;
    } catch (error) {
      throw error;
    }
  }

  async getAttendanceMatrixOfDay(
    batchId: number,
    date: Date
  ): Promise<{ status: AttendanceStatus; count: number }[]> {
    try {
      const attendanceData = await prisma.attendance.groupBy({
        by: ["status"],
        where: {
          batchId: batchId,
          date: date,
        },
        _count: {
          status: true,
        },
      });
      return attendanceData.map((data) => ({
        status: data.status,
        count: data._count.status,
      }));
    } catch (error) {
      throw error;
    }
  }

  async getAttendanceMatrixOfMonth(
    batchId: number,
    month: number,
    year: number
  ): Promise<{ status: AttendanceStatus; count: number }[]> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      const attendanceData = await prisma.attendance.groupBy({
        by: ["status"],
        where: {
          batchId: batchId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          status: true,
        },
      });
      return attendanceData.map((data) => ({
        status: data.status,
        count: data._count.status,
      }));
    } catch (error) {
      throw error;
    }
  }
}
