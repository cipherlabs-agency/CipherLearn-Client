import {
  Attendance,
  AttendanceMethod,
  AttendanceStatus,
  Prisma,
} from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import { invalidateAfterAttendanceMutation } from "../../../cache/invalidation";
import {
  AttendanceMatrixOptions,
  DayAttendanceResponse,
  MarkBulkAttendanceInput,
  AttendanceReportQuery,
  AttendanceReport,
} from "./types";
import { getMonthRangeInUTC, toIntOrDefault } from "./utils";
import {
  generateQRPayload,
  verifyQRPayload,
  encodeQRPayload,
  decodeQRPayload,
  QRPayload,
  QRVerificationResult,
} from "./qr.utils";
import { log } from "../../../utils/logtail";

export default class AttendanceService {
  /**
   * Create attendance sheet for a batch/month/year
   */
  async createAttendanceSheet(
    attendanceSheet: Omit<
      Prisma.AttendanceSheetCreateInput,
      "id" | "createdAt" | "updatedAt"
    >
  ) {
    try {
      const newAttendanceSheet = await prisma.attendanceSheet.create({
        data: attendanceSheet,
      });
      return newAttendanceSheet;
    } catch (error) {
      log("error", "dashboard.attendance.create failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Mark manual attendance for a single student
   */
  async markManualAttendance(
    attendance: Omit<
      Prisma.AttendanceCreateInput,
      "id" | "createdAt" | "updatedAt"
    >
  ) {
    try {
      const newAttendance = await prisma.attendance.create({
        data: { ...attendance, method: AttendanceMethod.MANUAL },
      });
      invalidateAfterAttendanceMutation();
      return newAttendance;
    } catch (error) {
      log("error", "dashboard.attendance.invalidateAfterAttendanceMutation failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Mark bulk attendance for multiple students (Admin/Teacher)
   */
  async markBulkAttendance(input: MarkBulkAttendanceInput) {
    try {
      const { batchId, date, markedBy, markedById, attendances } = input;

      // Validate batch exists
      const batch = await prisma.batch.findUnique({ where: { id: batchId } });
      if (!batch) {
        throw new Error("Batch not found");
      }

      // Get or create attendance sheet for this month/year
      const attendanceDate = new Date(date);
      const month = String(attendanceDate.getMonth() + 1);
      const year = String(attendanceDate.getFullYear());

      let sheet = await prisma.attendanceSheet.findUnique({
        where: {
          batchId_year_month: { batchId, year, month },
        },
      });

      if (!sheet) {
        sheet = await prisma.attendanceSheet.create({
          data: {
            batch: { connect: { id: batchId } },
            month,
            year,
          },
        });
      }

      // Process each attendance record
      const results = await Promise.all(
        attendances.map(async (record) => {
          try {
            // Upsert attendance - update if exists, create if not
            const attendance = await prisma.attendance.upsert({
              where: {
                studentId_date_batchId: {
                  studentId: record.studentId,
                  date: attendanceDate,
                  batchId,
                },
              },
              update: {
                status: record.status,
                markedBy,
                markedById,
                method: AttendanceMethod.MANUAL,
                time: new Date().toTimeString().slice(0, 8),
              },
              create: {
                student: { connect: { id: record.studentId } },
                batch: { connect: { id: batchId } },
                date: attendanceDate,
                status: record.status,
                markedBy,
                markedById,
                method: AttendanceMethod.MANUAL,
                time: new Date().toTimeString().slice(0, 8),
                attendanceSheet: { connect: { id: sheet!.id } },
              },
            });
            return { success: true, studentId: record.studentId, attendance };
          } catch (error: any) {
            log("error", "dashboard.attendance.Date failed", { err: error instanceof Error ? error.message : String(error) });
            return {
              success: false,
              studentId: record.studentId,
              error: error.message,
            };
          }
        })
      );

      const studentIds = attendances.map((a) => a.studentId);
      invalidateAfterAttendanceMutation(batchId, studentIds);

      return {
        sheetId: sheet.id,
        processed: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    } catch (error) {
      log("error", "dashboard.attendance.filter failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Update a single attendance record
   */
  async updateAttendance(
    attendanceId: number,
    data: { status?: AttendanceStatus; markedBy?: string; markedById?: number }
  ) {
    try {
      const attendance = await prisma.attendance.findUnique({
        where: { id: attendanceId },
      });

      if (!attendance) {
        throw new Error("Attendance record not found");
      }

      const updated = await prisma.attendance.update({
        where: { id: attendanceId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return updated;
    } catch (error) {
      log("error", "dashboard.attendance.Date failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get batch attendance for a specific date
   */
  async getBatchAttendanceByDate(
    batchId: number,
    date: string
  ): Promise<Attendance[]> {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        throw new Error("Batch not found");
      }

      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const attendances = await prisma.attendance.findMany({
        where: {
          batchId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          student: {
            select: {
              id: true,
              fullname: true,
              email: true,
            },
          },
        },
      });

      return attendances;
    } catch (error) {
      log("error", "dashboard.attendance.findMany failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get all attendance sheets for a batch
   */
  async getBatchAttendanceSheet(batchId: number): Promise<Attendance[]> {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        throw new Error("Batch not found");
      }

      const attendanceSheets = await prisma.attendance.findMany({
        where: { batchId },
      });
      return attendanceSheets;
    } catch (error) {
      log("error", "dashboard.attendance.findMany failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get student attendance matrix for a month
   */
  async getStudentAttendanceMatrix(
    studentId: number,
    opts: AttendanceMatrixOptions = {}
  ): Promise<{
    month: { month: number; days: DayAttendanceResponse[] };
    year: number;
  }> {
    const now = new Date();
    const defaultMonth = now.getUTCMonth() + 1;
    const defaultYear = now.getUTCFullYear();

    const monthNum = toIntOrDefault(opts.month, defaultMonth);
    const yearNum = toIntOrDefault(opts.year, defaultYear);

    if (monthNum < 1 || monthNum > 12) {
      throw new Error("Invalid month. Use 1..12");
    }

    const { start, end } = getMonthRangeInUTC(yearNum, monthNum);

    const attendanceRows = await prisma.attendance.findMany({
      where: {
        studentId,
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        id: true,
        status: true,
        date: true,
        method: true,
        markedBy: true,
        time: true,
        studentId: true,
      },
      orderBy: { date: "asc" },
    });

    const map = new Map<string, any>();
    const tzOffsetMinutes = 5 * 60 + 30;
    for (const r of attendanceRows) {
      const localMs = r.date.getTime() + tzOffsetMinutes * 60 * 1000;
      const localDate = new Date(localMs).toISOString().slice(0, 10);
      map.set(localDate, r);
    }

    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const days: DayAttendanceResponse[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const yyyy = String(yearNum).padStart(4, "0");
      const mm = String(monthNum).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;

      const rec = map.get(key) ?? null;

      days.push({
        day: d,
        date: key,
        attendance: rec
          ? {
              id: rec.id,
              status: String(rec.status),
              method: String(rec.method),
              markedBy: rec.markedBy ?? null,
              time: rec.time ?? null,
              studentId: rec.studentId,
            }
          : null,
      });
    }

    return {
      month: {
        month: monthNum,
        days,
      },
      year: yearNum,
    };
  }

  /**
   * Generate attendance report for a batch (paginated, SQL-aggregated)
   */
  async generateAttendanceReport(
    query: AttendanceReportQuery
  ): Promise<AttendanceReport> {
    try {
      const { batchId, startDate, endDate, page = 1, limit = 50 } = query;
      const skip = (page - 1) * limit;

      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: { id: true, name: true },
      });

      if (!batch) throw new Error("Batch not found");

      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateWhere = { batchId, date: { gte: start, lte: end } };

      // Fetch total student count, paginated students, and overall attendance stats in parallel
      const [totalStudents, pagedStudents, overallGroups] = await Promise.all([
        prisma.student.count({ where: { batchId, isDeleted: false } }),
        prisma.student.findMany({
          where: { batchId, isDeleted: false },
          select: { id: true, fullname: true, email: true },
          orderBy: { fullname: "asc" },
          skip,
          take: limit,
        }),
        // Group by status across ALL students for overall percentage
        prisma.attendance.groupBy({
          by: ["status"],
          where: dateWhere,
          _count: { status: true },
        }),
      ]);

      // Fetch per-student attendance grouped by (studentId, status) for just this page
      const pageStudentIds = pagedStudents.map((s) => s.id);
      const pageGroups = pageStudentIds.length > 0
        ? await prisma.attendance.groupBy({
            by: ["studentId", "status"],
            where: { ...dateWhere, studentId: { in: pageStudentIds } },
            _count: { status: true },
          })
        : [];

      // Build per-student stats from groupBy result
      const statsMap = new Map<number, { PRESENT: number; LATE: number; ABSENT: number }>();
      for (const g of pageGroups) {
        const entry = statsMap.get(g.studentId) ?? { PRESENT: 0, LATE: 0, ABSENT: 0 };
        entry[g.status as keyof typeof entry] = g._count.status;
        statsMap.set(g.studentId, entry);
      }

      const studentStats = pagedStudents.map((student) => {
        const counts = statsMap.get(student.id) ?? { PRESENT: 0, LATE: 0, ABSENT: 0 };
        const presentDays = counts.PRESENT + counts.LATE;
        const absentDays = counts.ABSENT;
        const totalDays = presentDays + absentDays;
        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        return {
          studentId: student.id,
          studentName: student.fullname,
          email: student.email,
          presentDays,
          absentDays,
          totalDays,
          percentage,
        };
      });

      // Compute overall percentage from all-student groups
      const presentTotal = overallGroups.find((g) => g.status === AttendanceStatus.PRESENT)?._count.status ?? 0;
      const lateTotal = overallGroups.find((g) => g.status === AttendanceStatus.LATE)?._count.status ?? 0;
      const absentTotal = overallGroups.find((g) => g.status === AttendanceStatus.ABSENT)?._count.status ?? 0;
      const totalRecords = presentTotal + lateTotal + absentTotal;
      const overallPercentage = totalRecords > 0 ? Math.round(((presentTotal + lateTotal) / totalRecords) * 100) : 0;

      return {
        batchId,
        batchName: batch.name,
        startDate,
        endDate,
        totalStudents,
        overallAttendancePercentage: overallPercentage,
        studentStats,
        pagination: { page, limit, total: totalStudents, totalPages: Math.ceil(totalStudents / limit) },
      };
    } catch (error) {
      log("error", "dashboard.attendance.round failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // =====================
  // QR CODE ATTENDANCE
  // =====================

  /**
   * Generate QR code for a batch (daily)
   */
  async generateBatchQRCode(batchId: number) {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        throw new Error("Batch not found");
      }

      const payload = generateQRPayload(batchId);
      const encodedPayload = encodeQRPayload(payload);

      return {
        batchId,
        batchName: batch.name,
        qrData: encodedPayload,
        payload,
        validFor: payload.date,
        expiresAt: payload.expiresAt,
      };
    } catch (error) {
      log("error", "dashboard.attendance.encodeQRPayload failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Mark attendance via QR code scan
   */
  async markQRAttendance(
    studentId: number,
    qrData: string
  ): Promise<{ success: boolean; message: string; attendance?: Attendance }> {
    try {
      // Decode and verify QR payload
      const payload = decodeQRPayload(qrData);
      if (!payload) {
        return { success: false, message: "Invalid QR code format" };
      }

      const verification = verifyQRPayload(payload);
      if (!verification.valid) {
        return { success: false, message: verification.error || "Invalid QR code" };
      }

      const { batchId, date } = verification;

      // Verify student exists and belongs to the batch
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        return { success: false, message: "Student not found" };
      }

      if (student.batchId !== batchId) {
        return {
          success: false,
          message: "You are not enrolled in this batch",
        };
      }

      // Check for existing attendance on this date
      const attendanceDate = new Date(date!);
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          studentId_date_batchId: {
            studentId,
            date: attendanceDate,
            batchId: batchId!,
          },
        },
      });

      if (existingAttendance) {
        return {
          success: false,
          message: "Attendance already marked for today",
        };
      }

      // Get or create attendance sheet
      const month = String(attendanceDate.getMonth() + 1);
      const year = String(attendanceDate.getFullYear());

      let sheet = await prisma.attendanceSheet.findUnique({
        where: {
          batchId_year_month: { batchId: batchId!, year, month },
        },
      });

      if (!sheet) {
        sheet = await prisma.attendanceSheet.create({
          data: {
            batch: { connect: { id: batchId! } },
            month,
            year,
          },
        });
      }

      // Mark attendance
      const attendance = await prisma.attendance.create({
        data: {
          student: { connect: { id: studentId } },
          batch: { connect: { id: batchId! } },
          date: attendanceDate,
          status: AttendanceStatus.PRESENT,
          method: AttendanceMethod.QR,
          markedBy: "QR_SCAN",
          time: new Date().toTimeString().slice(0, 8),
          attendanceSheet: { connect: { id: sheet.id } },
        },
      });

      return {
        success: true,
        message: "Attendance marked successfully",
        attendance,
      };
    } catch (error: any) {
      log("error", "dashboard.attendance.Date failed", { err: error instanceof Error ? error.message : String(error) });
      console.error("QR Attendance error:", error);
      return { success: false, message: error.message || "Failed to mark attendance" };
    }
  }

  /**
   * Get attendance history for student
   */
  async getStudentAttendanceHistory(
    studentId: number,
    limit: number = 30
  ): Promise<Attendance[]> {
    try {
      const attendances = await prisma.attendance.findMany({
        where: { studentId },
        orderBy: { date: "desc" },
        take: limit,
        include: {
          batch: {
            select: { id: true, name: true },
          },
        },
      });

      return attendances;
    } catch (error) {
      log("error", "dashboard.attendance.findMany failed", { err: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
