import {
  Attendance,
  AttendanceMethod,
  AttendanceStatus,
} from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import {
  generateQRPayload,
  verifyQRPayload,
  encodeQRPayload,
  decodeQRPayload,
} from "./qr.utils";
import QRCode from "qrcode";

/**
 * QR Attendance Service
 * Handles QR code generation, validation, and attendance marking
 */
export class QRAttendanceService {
  /**
   * Get today's date at start of day (midnight)
   */
  private getTodayDateOnly(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Get end of day for a given date (11:59:59 PM)
   */
  private getEndOfDay(date: Date): Date {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  /**
   * Generate QR code for a batch (daily)
   * Stores the QR token in database for validation
   */
  async generateBatchQRCode(batchId: number, forceRegenerate: boolean = false) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    const todayDate = this.getTodayDateOnly();
    const expiresAt = this.getEndOfDay(todayDate);

    // Check if a QR token already exists for today
    const existingToken = await prisma.qRAttendanceToken.findUnique({
      where: {
        batchId_date: {
          batchId,
          date: todayDate,
        },
      },
    });

    // If token exists and not forcing regenerate, return existing
    if (existingToken && !forceRegenerate) {
      const payload = generateQRPayload(batchId, todayDate);
      const encodedPayload = encodeQRPayload(payload);

      // Generate QR code image as base64 PNG
      const qrImageBase64 = await this.generateQRCodeImage(encodedPayload);

      return {
        batchId,
        batchName: batch.name,
        qrData: encodedPayload,
        qrImageBase64,
        payload,
        validFor: payload.date,
        expiresAt: payload.expiresAt,
        isExisting: true,
        tokenId: existingToken.id,
      };
    }

    // Generate new payload
    const payload = generateQRPayload(batchId, todayDate);
    const encodedPayload = encodeQRPayload(payload);

    // Store or update the token in database
    const qrToken = await prisma.qRAttendanceToken.upsert({
      where: {
        batchId_date: {
          batchId,
          date: todayDate,
        },
      },
      update: {
        token: payload.token,
        expiresAt,
        isActive: true,
      },
      create: {
        batch: { connect: { id: batchId } },
        token: payload.token,
        date: todayDate,
        expiresAt,
        isActive: true,
      },
    });

    // Generate QR code image as base64 PNG
    const qrImageBase64 = await this.generateQRCodeImage(encodedPayload);

    return {
      batchId,
      batchName: batch.name,
      qrData: encodedPayload,
      qrImageBase64,
      payload,
      validFor: payload.date,
      expiresAt: payload.expiresAt,
      isExisting: false,
      tokenId: qrToken.id,
    };
  }

  /**
   * Generate QR code image as base64 PNG data URL
   * Creates a high-quality, scannable QR code image
   */
  private async generateQRCodeImage(data: string): Promise<string> {
    try {
      const qrImageDataUrl = await QRCode.toDataURL(data, {
        type: "image/png",
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H", // High error correction for better scanning
      });
      return qrImageDataUrl;
    } catch (error) {
      console.error("Failed to generate QR code image:", error);
      throw new Error("Failed to generate QR code image");
    }
  }

  /**
   * Get QR code status for a batch (check if QR exists for today)
   */
  async getQRCodeStatus(batchId: number) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    const todayDate = this.getTodayDateOnly();
    const now = new Date();

    // Check if a QR token exists for today
    const existingToken = await prisma.qRAttendanceToken.findUnique({
      where: {
        batchId_date: {
          batchId,
          date: todayDate,
        },
      },
    });

    if (!existingToken) {
      return {
        exists: false,
        batchId,
        batchName: batch.name,
        date: todayDate.toISOString().split("T")[0],
        message: "No QR code generated for today",
      };
    }

    // Check if token is expired
    const isExpired = new Date(existingToken.expiresAt) < now;
    const isActive = existingToken.isActive && !isExpired;

    return {
      exists: true,
      batchId,
      batchName: batch.name,
      date: todayDate.toISOString().split("T")[0],
      expiresAt: existingToken.expiresAt.toISOString(),
      isActive,
      isExpired,
      tokenId: existingToken.id,
      createdAt: existingToken.createdAt,
    };
  }

  /**
   * Mark attendance via QR code scan
   * Validates token against database and verifies user identity
   * @param studentId - The student ID to mark attendance for
   * @param qrData - The encoded QR code data
   * @param userEmail - The authenticated user's email for security verification
   */
  async markQRAttendance(
    studentId: number,
    qrData: string,
    userEmail?: string
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

      // Validate token exists in database
      const todayDate = this.getTodayDateOnly();
      const storedToken = await prisma.qRAttendanceToken.findUnique({
        where: {
          batchId_date: {
            batchId: batchId!,
            date: todayDate,
          },
        },
      });

      if (!storedToken) {
        return { success: false, message: "QR code is not valid or has not been generated" };
      }

      // Verify token matches
      if (storedToken.token !== payload.token) {
        return { success: false, message: "Invalid QR code token" };
      }

      // Check if token is active and not expired
      const now = new Date();
      if (!storedToken.isActive) {
        return { success: false, message: "QR code has been deactivated" };
      }

      if (new Date(storedToken.expiresAt) < now) {
        return { success: false, message: "QR code has expired" };
      }

      // Verify student exists and belongs to the batch
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        return { success: false, message: "Student not found" };
      }

      // Security check: Verify authenticated user's email matches student's email
      // This prevents students from marking attendance for other students
      if (userEmail && student.email.toLowerCase() !== userEmail.toLowerCase()) {
        return {
          success: false,
          message: "You can only mark attendance for your own account",
        };
      }

      if (student.batchId !== batchId) {
        return {
          success: false,
          message: "You are not enrolled in this batch",
        };
      }

      // Check if student is deleted
      if (student.isDeleted) {
        return { success: false, message: "Student account is inactive" };
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
      console.error("QR Attendance error:", error);
      return { success: false, message: error.message || "Failed to mark attendance" };
    }
  }
}

export const qrAttendanceService = new QRAttendanceService();
