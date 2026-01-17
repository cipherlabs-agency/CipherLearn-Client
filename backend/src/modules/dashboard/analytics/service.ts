import { AttendanceStatus } from "../../../../prisma/generated/prisma/enums";
import { prisma } from "../../../config/db.config";

interface EnrollmentTrendData {
  month: number;
  year: number;
  count: number;
  label: string;
}

interface AttendanceTrendData {
  date: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

interface DashboardStats {
  totalStudents: number;
  totalBatches: number;
  todayAttendance: {
    present: number;
    absent: number;
    percentage: number;
  };
  monthlyGrowth: {
    students: number;
    attendance: number;
  };
}

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

  /**
   * Get student enrollment trends for the last N months
   */
  async getEnrollmentTrends(months: number = 12): Promise<EnrollmentTrendData[]> {
    try {
      const trends: EnrollmentTrendData[] = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

        const count = await prisma.student.count({
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            isDeleted: false,
          },
        });

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        trends.push({
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          count,
          label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        });
      }

      return trends;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get attendance trends for the last N days
   */
  async getAttendanceTrends(days: number = 30, batchId?: number): Promise<AttendanceTrendData[]> {
    try {
      const trends: AttendanceTrendData[] = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const whereClause: any = {
          date: {
            gte: date,
            lte: endOfDay,
          },
        };

        if (batchId) {
          whereClause.batchId = batchId;
        }

        const attendanceData = await prisma.attendance.groupBy({
          by: ["status"],
          where: whereClause,
          _count: {
            status: true,
          },
        });

        let present = 0;
        let absent = 0;

        attendanceData.forEach((data) => {
          if (data.status === AttendanceStatus.PRESENT) {
            present = data._count.status;
          } else if (data.status === AttendanceStatus.ABSENT) {
            absent = data._count.status;
          }
        });

        const total = present + absent;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        trends.push({
          date: date.toISOString().split('T')[0],
          present,
          absent,
          total,
          percentage,
        });
      }

      return trends;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get monthly attendance trends
   */
  async getMonthlyAttendanceTrends(months: number = 6, batchId?: number): Promise<AttendanceTrendData[]> {
    try {
      const trends: AttendanceTrendData[] = [];
      const now = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

        const whereClause: any = {
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        };

        if (batchId) {
          whereClause.batchId = batchId;
        }

        const attendanceData = await prisma.attendance.groupBy({
          by: ["status"],
          where: whereClause,
          _count: {
            status: true,
          },
        });

        let present = 0;
        let absent = 0;

        attendanceData.forEach((data) => {
          if (data.status === AttendanceStatus.PRESENT) {
            present = data._count.status;
          } else if (data.status === AttendanceStatus.ABSENT) {
            absent = data._count.status;
          }
        });

        const total = present + absent;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        trends.push({
          date: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
          present,
          absent,
          total,
          percentage,
        });
      }

      return trends;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // Total counts
      const totalStudents = await prisma.student.count({ where: { isDeleted: false } });
      const totalBatches = await prisma.batch.count({ where: { isDeleted: false } });

      // Today's attendance
      const todayAttendance = await prisma.attendance.groupBy({
        by: ["status"],
        where: {
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        _count: {
          status: true,
        },
      });

      let todayPresent = 0;
      let todayAbsent = 0;
      todayAttendance.forEach((data) => {
        if (data.status === AttendanceStatus.PRESENT) {
          todayPresent = data._count.status;
        } else if (data.status === AttendanceStatus.ABSENT) {
          todayAbsent = data._count.status;
        }
      });
      const todayTotal = todayPresent + todayAbsent;
      const todayPercentage = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;

      // Monthly growth - students
      const thisMonthStudents = await prisma.student.count({
        where: {
          createdAt: { gte: startOfMonth },
          isDeleted: false,
        },
      });
      const lastMonthStudents = await prisma.student.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          isDeleted: false,
        },
      });
      const studentGrowth = lastMonthStudents > 0
        ? Math.round(((thisMonthStudents - lastMonthStudents) / lastMonthStudents) * 100)
        : thisMonthStudents > 0 ? 100 : 0;

      // Monthly growth - attendance
      const thisMonthAttendance = await prisma.attendance.count({
        where: {
          date: { gte: startOfMonth },
          status: AttendanceStatus.PRESENT,
        },
      });
      const lastMonthAttendance = await prisma.attendance.count({
        where: {
          date: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: AttendanceStatus.PRESENT,
        },
      });
      const attendanceGrowth = lastMonthAttendance > 0
        ? Math.round(((thisMonthAttendance - lastMonthAttendance) / lastMonthAttendance) * 100)
        : thisMonthAttendance > 0 ? 100 : 0;

      return {
        totalStudents,
        totalBatches,
        todayAttendance: {
          present: todayPresent,
          absent: todayAbsent,
          percentage: todayPercentage,
        },
        monthlyGrowth: {
          students: studentGrowth,
          attendance: attendanceGrowth,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get batch-wise student distribution
   */
  async getBatchDistribution(): Promise<{ batchId: number; batchName: string; studentCount: number }[]> {
    try {
      const batches = await prisma.batch.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          name: true,
          _count: {
            select: { students: { where: { isDeleted: false } } },
          },
        },
      });

      return batches.map((batch) => ({
        batchId: batch.id,
        batchName: batch.name,
        studentCount: batch._count.students,
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get recent activities (enrollments, attendance marks, etc.)
   */
  async getRecentActivities(limit: number = 10): Promise<any[]> {
    try {
      const recentStudents = await prisma.student.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          fullname: true,
          email: true,
          createdAt: true,
          batch: { select: { name: true } },
        },
      });

      const recentAttendance = await prisma.attendance.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          status: true,
          method: true,
          markedBy: true,
          createdAt: true,
          student: { select: { fullname: true } },
          batch: { select: { name: true } },
        },
      });

      const activities: any[] = [];

      recentStudents.forEach((student) => {
        activities.push({
          type: "enrollment",
          message: `${student.fullname} enrolled in ${student.batch?.name || 'Unknown Batch'}`,
          timestamp: student.createdAt,
          details: { studentId: student.id, email: student.email },
        });
      });

      recentAttendance.forEach((attendance) => {
        activities.push({
          type: "attendance",
          message: `${attendance.student.fullname} marked ${attendance.status} in ${attendance.batch.name}`,
          timestamp: attendance.createdAt,
          details: { method: attendance.method, markedBy: attendance.markedBy },
        });
      });

      // Sort by timestamp and return top N
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      throw error;
    }
  }
}
