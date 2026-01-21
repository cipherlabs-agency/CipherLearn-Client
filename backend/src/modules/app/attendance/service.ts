import { prisma } from "../../../config/db.config";
import { AttendanceStatus } from "../../../../prisma/generated/prisma/client";
import { decodeQRPayload, verifyQRPayload } from "../../dashboard/attendance/qr.utils";
import type {
  AttendancePerformance,
  MonthlyAttendance,
  RecentAttendance,
  QRAttendanceResult,
} from "./types";

class AttendanceService {
  /**
   * Get attendance performance for a student
   */
  async getAttendancePerformance(
    studentId: number,
    batchId: number | null
  ): Promise<AttendancePerformance> {
    if (!batchId) {
      return {
        totalClasses: 0,
        present: 0,
        absent: 0,
        attendancePercentage: 0,
        monthlyBreakdown: [],
        recentAttendance: [],
      };
    }

    // Get all attendance records
    const attendances = await prisma.attendance.findMany({
      where: {
        studentId,
        batchId,
      },
      orderBy: { date: "desc" },
    });

    const totalClasses = attendances.length;
    const present = attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const absent = totalClasses - present;
    const attendancePercentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

    // Monthly breakdown
    const monthlyMap = new Map<string, MonthlyAttendance>();

    attendances.forEach((a) => {
      const date = new Date(a.date);
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      const key = `${month}-${year}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month,
          year,
          present: 0,
          absent: 0,
          total: 0,
          percentage: 0,
        });
      }

      const entry = monthlyMap.get(key)!;
      entry.total++;
      if (a.status === AttendanceStatus.PRESENT) {
        entry.present++;
      } else {
        entry.absent++;
      }
      entry.percentage = Math.round((entry.present / entry.total) * 100);
    });

    const monthlyBreakdown = Array.from(monthlyMap.values()).slice(0, 6);

    // Recent attendance (last 10)
    const recentAttendance: RecentAttendance[] = attendances.slice(0, 10).map((a) => ({
      date: a.date.toISOString(),
      status: a.status,
      markedBy: a.markedBy || undefined,
      method: a.method,
    }));

    return {
      totalClasses,
      present,
      absent,
      attendancePercentage,
      monthlyBreakdown,
      recentAttendance,
    };
  }

  /**
   * Mark attendance via QR code
   */
  async markQRAttendance(
    studentId: number,
    batchId: number,
    qrData: string
  ): Promise<QRAttendanceResult> {
    // Decode QR data
    const payload = decodeQRPayload(qrData);
    if (!payload) {
      return { success: false, message: "Invalid QR code format" };
    }

    // Verify the payload
    const verification = verifyQRPayload(payload);
    if (!verification.valid) {
      return { success: false, message: verification.error || "Invalid QR code" };
    }

    // Check batch matches
    if (payload.batchId !== batchId) {
      return { success: false, message: "QR code is for a different batch" };
    }

    // Verify QR token exists in database
    const qrToken = await prisma.qRAttendanceToken.findFirst({
      where: {
        token: payload.token,
        batchId,
        isActive: true,
        expiresAt: { gte: new Date() },
      },
    });

    if (!qrToken) {
      return { success: false, message: "Invalid or expired QR code" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already marked
    const existing = await prisma.attendance.findFirst({
      where: {
        studentId,
        batchId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existing) {
      return { success: false, message: "Attendance already marked for today" };
    }

    // Get or create attendance sheet
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const year = today.getFullYear().toString();

    let sheet = await prisma.attendanceSheet.findUnique({
      where: {
        batchId_year_month: { batchId, year, month },
      },
    });

    if (!sheet) {
      sheet = await prisma.attendanceSheet.create({
        data: { batchId, year, month },
      });
    }

    // Mark attendance
    await prisma.attendance.create({
      data: {
        studentId,
        batchId,
        date: new Date(),
        time: new Date().toLocaleTimeString(),
        status: AttendanceStatus.PRESENT,
        method: "QR",
        attendanceSheetId: sheet.id,
      },
    });

    return { success: true, message: "Attendance marked successfully" };
  }
}

export const attendanceService = new AttendanceService();
