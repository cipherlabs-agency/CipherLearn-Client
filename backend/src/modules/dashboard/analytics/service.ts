import { AttendanceStatus } from "../../../../prisma/generated/prisma/enums";
import { prisma } from "../../../config/db.config";
import { cacheService } from "../../../cache";
import { DashboardKeys } from "../../../cache/keys";
import * as TTL from "../../../cache/ttl";
import { log } from "../../../utils/logtail";

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

interface ActivityItem {
  type: "enrollment" | "attendance";
  message: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export default class AnalyticsService {
  async getTotalStudentsCountOfBatch(batchId: number): Promise<number> {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: { _count: { select: { students: true } } },
      });
      if (!batch) throw new Error("Batch not found");
      return batch._count.students;
    } catch (error) {
      log("error", "dashboard.analytics.Error failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async getTotalStudentsCount(): Promise<number> {
    try {
      return await prisma.student.count();
    } catch (error) {
      log("error", "dashboard.analytics.count failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async getTotalBatchesCount(): Promise<number> {
    try {
      return await prisma.batch.count();
    } catch (error) {
      log("error", "dashboard.analytics.count failed", { err: error instanceof Error ? error.message : String(error) });
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
        where: { batchId, date },
        _count: { status: true },
      });
      return attendanceData.map((d) => ({ status: d.status, count: d._count.status }));
    } catch (error) {
      log("error", "dashboard.analytics.map failed", { err: error instanceof Error ? error.message : String(error) });
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
        where: { batchId, date: { gte: startDate, lte: endDate } },
        _count: { status: true },
      });
      return attendanceData.map((d) => ({ status: d.status, count: d._count.status }));
    } catch (error) {
      log("error", "dashboard.analytics.map failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get student enrollment trends for the last N months
   */
  async getEnrollmentTrends(months: number = 12): Promise<EnrollmentTrendData[]> {
    return cacheService.getOrSet(
      DashboardKeys.enrollmentTrends(months),
      () => this._fetchEnrollmentTrends(months),
      TTL.ENROLLMENT_TRENDS
    );
  }

  private async _fetchEnrollmentTrends(months: number): Promise<EnrollmentTrendData[]> {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      type Row = { month: Date; count: bigint };
      const rows = await prisma.$queryRaw<Row[]>`
        SELECT date_trunc('month', "createdAt") AS month, COUNT(*) AS count
        FROM students
        WHERE "isDeleted" = false
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY 1
        ORDER BY 1
      `;

      const monthMap = new Map(
        rows.map((r) => [new Date(r.month).toISOString().slice(0, 7), Number(r.count)])
      );

      const result: EnrollmentTrendData[] = [];
      let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      while (cursor <= lastMonth) {
        const key = cursor.toISOString().slice(0, 7);
        result.push({
          month: cursor.getMonth() + 1,
          year: cursor.getFullYear(),
          count: monthMap.get(key) ?? 0,
          label: `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`,
        });
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }

      return result;
    } catch (error) {
      log("error", "dashboard.analytics.getMonth failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get attendance trends for the last N days
   */
  async getAttendanceTrends(days: number = 30, batchId?: number): Promise<AttendanceTrendData[]> {
    return cacheService.getOrSet(
      DashboardKeys.attendanceTrends(days, batchId),
      () => this._fetchAttendanceTrends(days, batchId),
      TTL.ATTENDANCE_TRENDS
    );
  }

  private async _fetchAttendanceTrends(days: number, batchId?: number): Promise<AttendanceTrendData[]> {
    try {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (days - 1));
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      type Row = { date: Date; status: string; cnt: bigint };
      const rows = batchId
        ? await prisma.$queryRaw<Row[]>`
            SELECT date_trunc('day', date) AS date, status, COUNT(*) AS cnt
            FROM attendances
            WHERE date >= ${startDate} AND date <= ${endDate} AND "batchId" = ${batchId}
            GROUP BY 1, 2 ORDER BY 1
          `
        : await prisma.$queryRaw<Row[]>`
            SELECT date_trunc('day', date) AS date, status, COUNT(*) AS cnt
            FROM attendances
            WHERE date >= ${startDate} AND date <= ${endDate}
            GROUP BY 1, 2 ORDER BY 1
          `;

      const dateMap = new Map<string, { present: number; absent: number }>();
      for (const row of rows) {
        const key = new Date(row.date).toISOString().split("T")[0];
        const entry = dateMap.get(key) ?? { present: 0, absent: 0 };
        // LATE intentionally excluded from trend data (matches original behaviour)
        if (row.status === "PRESENT") entry.present += Number(row.cnt);
        else if (row.status === "ABSENT") entry.absent += Number(row.cnt);
        dateMap.set(key, entry);
      }

      const result: AttendanceTrendData[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().split("T")[0];
        const { present = 0, absent = 0 } = dateMap.get(key) ?? {};
        const total = present + absent;
        result.push({ date: key, present, absent, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 });
      }
      return result;
    } catch (error) {
      log("error", "dashboard.analytics.toISOString failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get monthly attendance trends
   */
  async getMonthlyAttendanceTrends(months: number = 6, batchId?: number): Promise<AttendanceTrendData[]> {
    return cacheService.getOrSet(
      DashboardKeys.monthlyAttendanceTrends(months, batchId),
      () => this._fetchMonthlyAttendanceTrends(months, batchId),
      TTL.ATTENDANCE_TRENDS
    );
  }

  private async _fetchMonthlyAttendanceTrends(months: number, batchId?: number): Promise<AttendanceTrendData[]> {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      type Row = { month: Date; status: string; cnt: bigint };
      const rows = batchId
        ? await prisma.$queryRaw<Row[]>`
            SELECT date_trunc('month', date) AS month, status, COUNT(*) AS cnt
            FROM attendances
            WHERE date >= ${startDate} AND date <= ${endDate} AND "batchId" = ${batchId}
            GROUP BY 1, 2 ORDER BY 1
          `
        : await prisma.$queryRaw<Row[]>`
            SELECT date_trunc('month', date) AS month, status, COUNT(*) AS cnt
            FROM attendances
            WHERE date >= ${startDate} AND date <= ${endDate}
            GROUP BY 1, 2 ORDER BY 1
          `;

      const monthMap = new Map<string, { present: number; absent: number }>();
      for (const row of rows) {
        const key = new Date(row.month).toISOString().slice(0, 7);
        const entry = monthMap.get(key) ?? { present: 0, absent: 0 };
        if (row.status === "PRESENT") entry.present += Number(row.cnt);
        else if (row.status === "ABSENT") entry.absent += Number(row.cnt);
        monthMap.set(key, entry);
      }

      const result: AttendanceTrendData[] = [];
      let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      while (cursor <= lastMonth) {
        const key = cursor.toISOString().slice(0, 7);
        const { present = 0, absent = 0 } = monthMap.get(key) ?? {};
        const total = present + absent;
        result.push({
          date: `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`,
          present,
          absent,
          total,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        });
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }
      return result;
    } catch (error) {
      log("error", "dashboard.analytics.getMonth failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return cacheService.getOrSet(
      DashboardKeys.analyticsStats(),
      () => this._fetchDashboardStats(),
      TTL.DASHBOARD_STATS
    );
  }

  private async _fetchDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // All 7 queries fire in parallel — one round-trip to the pool
      const [
        totalStudents,
        totalBatches,
        todayAttendance,
        thisMonthStudents,
        lastMonthStudents,
        thisMonthAttendance,
        lastMonthAttendance,
      ] = await Promise.all([
        prisma.student.count({ where: { isDeleted: false } }),
        prisma.batch.count({ where: { isDeleted: false } }),
        prisma.attendance.groupBy({
          by: ["status"],
          where: { date: { gte: startOfToday, lte: endOfToday } },
          _count: { status: true },
        }),
        prisma.student.count({ where: { createdAt: { gte: startOfMonth }, isDeleted: false } }),
        prisma.student.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, isDeleted: false } }),
        prisma.attendance.count({ where: { date: { gte: startOfMonth }, status: AttendanceStatus.PRESENT } }),
        prisma.attendance.count({ where: { date: { gte: startOfLastMonth, lte: endOfLastMonth }, status: AttendanceStatus.PRESENT } }),
      ]);

      let todayPresent = 0;
      let todayAbsent = 0;
      for (const d of todayAttendance) {
        if (d.status === AttendanceStatus.PRESENT) todayPresent = d._count.status;
        else if (d.status === AttendanceStatus.ABSENT) todayAbsent = d._count.status;
      }
      const todayTotal = todayPresent + todayAbsent;

      const studentGrowth = lastMonthStudents > 0
        ? Math.round(((thisMonthStudents - lastMonthStudents) / lastMonthStudents) * 100)
        : thisMonthStudents > 0 ? 100 : 0;

      const attendanceGrowth = lastMonthAttendance > 0
        ? Math.round(((thisMonthAttendance - lastMonthAttendance) / lastMonthAttendance) * 100)
        : thisMonthAttendance > 0 ? 100 : 0;

      return {
        totalStudents,
        totalBatches,
        todayAttendance: {
          present: todayPresent,
          absent: todayAbsent,
          percentage: todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0,
        },
        monthlyGrowth: { students: studentGrowth, attendance: attendanceGrowth },
      };
    } catch (error) {
      log("error", "dashboard.analytics.round failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get batch-wise student distribution
   */
  async getBatchDistribution(): Promise<{ batchId: number; batchName: string; studentCount: number }[]> {
    return cacheService.getOrSet(
      DashboardKeys.batchDistribution(),
      () => this._fetchBatchDistribution(),
      TTL.BATCH_DISTRIBUTION
    );
  }

  private async _fetchBatchDistribution(): Promise<{ batchId: number; batchName: string; studentCount: number }[]> {
    try {
      const batches = await prisma.batch.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true, _count: { select: { students: { where: { isDeleted: false } } } } },
      });
      return batches.map((b) => ({ batchId: b.id, batchName: b.name, studentCount: b._count.students }));
    } catch (error) {
      log("error", "dashboard.analytics.map failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get recent activities (enrollments, attendance marks, etc.)
   */
  async getRecentActivities(limit: number = 10): Promise<ActivityItem[]> {
    return cacheService.getOrSet(
      DashboardKeys.recentActivities(limit),
      () => this._fetchRecentActivities(limit),
      TTL.RECENT_ACTIVITIES
    );
  }

  private async _fetchRecentActivities(limit: number): Promise<ActivityItem[]> {
    try {
      const [recentStudents, recentAttendance] = await Promise.all([
        prisma.student.findMany({
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: { id: true, fullname: true, email: true, createdAt: true, batch: { select: { name: true } } },
        }),
        prisma.attendance.findMany({
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
        }),
      ]);

      const activities: ActivityItem[] = [];

      for (const s of recentStudents) {
        activities.push({
          type: "enrollment",
          message: `${s.fullname} enrolled in ${s.batch?.name ?? "Unknown Batch"}`,
          timestamp: s.createdAt ?? new Date(0),
          details: { studentId: s.id, email: s.email },
        });
      }

      for (const a of recentAttendance) {
        activities.push({
          type: "attendance",
          message: `${a.student.fullname} marked ${a.status} in ${a.batch.name}`,
          timestamp: a.createdAt ?? new Date(0),
          details: { method: a.method, markedBy: a.markedBy },
        });
      }

      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      log("error", "dashboard.analytics.slice failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
