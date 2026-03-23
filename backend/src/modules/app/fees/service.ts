import { prisma } from "../../../config/db.config";
import { PaymentStatus, PaymentMode } from "../../../../prisma/generated/prisma/client";
import { cacheService } from "../../../cache/index";
import { AppKeys } from "../../../cache/keys";
import { APP_FEE_STRUCTURES } from "../../../cache/ttl";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../../../config/env.config";
import PDFDocument from "pdfkit";
import type { AppFeeReceipt, AppFeesSummary, AppFeeStructure, TeacherStudentFeeItem, TeacherStudentFeeDetail } from "./types";

class FeesService {
  /**
   * Get fee receipts for a student
   */
  async getFeeReceipts(studentId: number): Promise<AppFeeReceipt[]> {
    const receipts = await prisma.feeReceipt.findMany({
      where: { studentId },
      include: {
        feeStructure: {
          select: { name: true },
        },
      },
      orderBy: [{ academicYear: "desc" }, { academicMonth: "desc" }],
    });

    return receipts.map((r) => ({
      id: r.id,
      receiptNumber: r.receiptNumber,
      totalAmount: r.totalAmount,
      paidAmount: r.paidAmount,
      remainingAmount: r.remainingAmount,
      discountAmount: r.discountAmount,
      lateFeeAmount: r.lateFeeAmount,
      status: r.status,
      academicMonth: r.academicMonth,
      academicYear: r.academicYear,
      dueDate: r.dueDate.toISOString(),
      paymentDate: r.paymentDate?.toISOString() || null,
      paymentMode: r.paymentMode,
      feeName: r.feeStructure?.name || null,
    }));
  }

  /**
   * Get fees summary for a student
   */
  async getFeesSummary(studentId: number): Promise<AppFeesSummary> {
    const receipts = await prisma.feeReceipt.findMany({
      where: { studentId },
    });

    const summary: AppFeesSummary = {
      totalDue: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      receiptsCount: receipts.length,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    };

    receipts.forEach((r) => {
      summary.totalDue += r.totalAmount + r.lateFeeAmount - r.discountAmount;
      summary.totalPaid += r.paidAmount;

      if (r.status === PaymentStatus.PAID) {
        summary.paidCount++;
      } else if (r.status === PaymentStatus.OVERDUE) {
        summary.overdueCount++;
        summary.totalOverdue += r.remainingAmount;
      } else if (r.status === PaymentStatus.PENDING || r.status === PaymentStatus.PARTIAL) {
        summary.pendingCount++;
        summary.totalPending += r.remainingAmount;
      }
    });

    return summary;
  }

  /**
   * Get active fee structures for a batch
   */
  async getFeeStructures(batchId: number): Promise<AppFeeStructure[]> {
    return cacheService.getOrSet(
      AppKeys.feeStructures(batchId),
      async () => {
        const structures = await prisma.feeStructure.findMany({
          where: {
            batchId,
            isActive: true,
          },
          orderBy: { createdAt: "desc" },
        });

        return structures.map((s) => ({
          id: s.id,
          name: s.name,
          amount: s.amount,
          frequency: s.frequency,
          dueDay: s.dueDay,
          lateFee: s.lateFee,
          gracePeriod: s.gracePeriod,
          description: s.description,
        }));
      },
      APP_FEE_STRUCTURES
    );
  }

  // ==================== TEACHER METHODS ====================

  /**
   * Get all students in teacher's batches with their fee status
   */
  async getTeacherStudents(
    teacherId: number,
    opts?: { batchId?: number; status?: PaymentStatus }
  ): Promise<TeacherStudentFeeItem[]> {
    // Get all batches where this teacher has lectures
    const batchIds = await prisma.lecture.findMany({
      where: { teacherId, isDeleted: false },
      select: { batchId: true },
      distinct: ["batchId"],
    });

    const ids = batchIds.map((b) => b.batchId);
    const filteredIds = opts?.batchId ? ids.filter((id) => id === opts.batchId) : ids;

    const students = await prisma.student.findMany({
      where: { batchId: { in: filteredIds }, isDeleted: false },
      include: {
        batch: { select: { id: true, name: true } },
        feeReceipts: {
          orderBy: { dueDate: "asc" },
        },
      },
      orderBy: { fullname: "asc" },
    });

    return students
      .map((s) => {
        const pendingStatuses: string[] = [PaymentStatus.PENDING, PaymentStatus.OVERDUE, PaymentStatus.PARTIAL];
        const pendingReceipt = s.feeReceipts.find((r) => pendingStatuses.includes(r.status));
        const totalPaid = s.feeReceipts.reduce((acc, r) => acc + r.paidAmount, 0);
        const totalPending = s.feeReceipts.reduce((acc, r) => acc + r.remainingAmount, 0);
        const feeStatus = pendingReceipt?.status ?? PaymentStatus.PAID;

        return {
          id: s.id,
          fullname: s.fullname,
          rollNumber: s.instituteId ?? null,
          batch: s.batch ? { id: s.batch.id, name: s.batch.name } : null,
          paidAmount: totalPaid,
          pendingAmount: totalPending,
          dueDate: pendingReceipt?.dueDate.toISOString() ?? null,
          status: feeStatus,
        };
      })
      .filter((s) => !opts?.status || s.status === opts.status);
  }

  /**
   * Get full fee detail for a single student (teacher use)
   */
  async getStudentFeeDetail(studentId: number, teacherId: number): Promise<TeacherStudentFeeDetail> {
    // Verify teacher has access (teaches in the student's batch)
    const student = await prisma.student.findFirst({
      where: { id: studentId, isDeleted: false },
      include: { batch: { select: { id: true, name: true } } },
    });
    if (!student) throw new Error("Student not found");

    if (student.batchId) {
      const hasAccess = await prisma.lecture.findFirst({
        where: { teacherId, batchId: student.batchId, isDeleted: false },
      });
      if (!hasAccess) throw new Error("You do not teach this student's batch");
    }

    const [receipts, summary] = await Promise.all([
      this.getFeeReceipts(studentId),
      this.getFeesSummary(studentId),
    ]);

    return {
      student: {
        id: student.id,
        fullname: student.fullname,
        rollNumber: student.instituteId ?? null,
        phone: student.phone ?? null,
        parentName: student.parentName ?? null,
        batch: student.batch,
      },
      receipts,
      summary,
    };
  }

  /**
   * Record a payment for a student's fee receipt (teacher use)
   */
  async recordPayment(
    receiptId: number,
    teacherId: number,
    data: { paidAmount: number; paymentMode: PaymentMode; transactionId?: string; chequeNumber?: string; notes?: string; teacherName: string }
  ): Promise<AppFeeReceipt> {
    const receipt = await prisma.feeReceipt.findFirst({ where: { id: receiptId } });
    if (!receipt) throw new Error("Fee receipt not found");

    // Verify teacher has access to this batch
    const hasAccess = await prisma.lecture.findFirst({
      where: { teacherId, batchId: receipt.batchId, isDeleted: false },
    });
    if (!hasAccess) throw new Error("You do not have access to this student's batch");

    const newPaid = receipt.paidAmount + data.paidAmount;
    const newRemaining = Math.max(0, receipt.totalAmount + receipt.lateFeeAmount - receipt.discountAmount - newPaid);
    const newStatus: PaymentStatus = newRemaining <= 0 ? PaymentStatus.PAID : newPaid > 0 ? PaymentStatus.PARTIAL : receipt.status;

    const updated = await prisma.feeReceipt.update({
      where: { id: receiptId },
      data: {
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
        paymentMode: data.paymentMode,
        paymentDate: newStatus === PaymentStatus.PAID ? new Date() : receipt.paymentDate,
        transactionId: data.transactionId,
        chequeNumber: data.chequeNumber,
        paymentNotes: data.notes,
        modifiedBy: data.teacherName,
        modifiedById: teacherId,
      },
      include: { feeStructure: { select: { name: true } } },
    });

    return {
      id: updated.id,
      receiptNumber: updated.receiptNumber,
      totalAmount: updated.totalAmount,
      paidAmount: updated.paidAmount,
      remainingAmount: updated.remainingAmount,
      discountAmount: updated.discountAmount,
      lateFeeAmount: updated.lateFeeAmount,
      status: updated.status,
      academicMonth: updated.academicMonth,
      academicYear: updated.academicYear,
      dueDate: updated.dueDate.toISOString(),
      paymentDate: updated.paymentDate?.toISOString() ?? null,
      paymentMode: updated.paymentMode,
      feeName: updated.feeStructure?.name ?? null,
    };
  }

  /**
   * Generate a PDF for a fee receipt and return a Cloudinary URL.
   * React Native can open the URL via Linking.openURL().
   */
  async generateReceiptPdf(receiptId: number, studentId: number): Promise<{ pdfUrl: string }> {
    const receipt = await prisma.feeReceipt.findFirst({
      where: { id: receiptId, studentId },
      include: {
        student: { select: { fullname: true, email: true, instituteId: true } },
        feeStructure: { select: { name: true } },
        batch: { select: { name: true } },
      },
    });
    if (!receipt) throw new Error("Receipt not found");

    // Configure Cloudinary (reuse env config)
    cloudinary.config({
      cloud_name: config.CLOUDINAIRY.CLOUD_NAME,
      api_key: config.CLOUDINAIRY.API_KEY,
      api_secret: config.CLOUDINAIRY.API_SECRET,
      secure: true,
    });

    const className = config.CLASS.NAME;
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    // Build PDF in memory
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text(className, { align: "center" });
      doc.fontSize(12).font("Helvetica").text("Fee Receipt", { align: "center" });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Receipt meta
      doc.fontSize(10).font("Helvetica-Bold").text(`Receipt No: `, { continued: true }).font("Helvetica").text(receipt.receiptNumber);
      doc.fontSize(10).font("Helvetica-Bold").text(`Date: `, { continued: true }).font("Helvetica")
        .text(receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString("en-IN") : new Date(receipt.dueDate).toLocaleDateString("en-IN"));
      doc.moveDown(0.5);

      // Student info
      doc.font("Helvetica-Bold").text("Student Details", { underline: true });
      doc.font("Helvetica").text(`Name: ${receipt.student.fullname}`);
      if (receipt.student.instituteId) doc.text(`Roll No: ${receipt.student.instituteId}`);
      doc.text(`Class/Batch: ${receipt.batch.name}`);
      doc.text(`Period: ${MONTHS[(receipt.academicMonth - 1) % 12]} ${receipt.academicYear}`);
      doc.moveDown(0.5);

      // Fee details table
      doc.font("Helvetica-Bold").text("Fee Breakdown", { underline: true });
      doc.moveDown(0.3);
      const left = 50, right = 500;
      const lineY = () => doc.y;
      const row = (label: string, amount: number, bold = false) => {
        const font = bold ? "Helvetica-Bold" : "Helvetica";
        doc.font(font).text(label, left, lineY());
        doc.font(font).text(`₹ ${amount.toFixed(2)}`, right - 60, doc.y - doc.currentLineHeight(), { width: 60, align: "right" });
      };
      row("Base Fee", receipt.totalAmount);
      if (receipt.discountAmount > 0) row("Discount", -receipt.discountAmount);
      if (receipt.lateFeeAmount > 0) row("Late Fee", receipt.lateFeeAmount);
      doc.moveTo(left, doc.y + 2).lineTo(right, doc.y + 2).stroke();
      doc.moveDown(0.2);
      row("Total Due", receipt.totalAmount - receipt.discountAmount + receipt.lateFeeAmount, true);
      row("Amount Paid", receipt.paidAmount, true);
      if (receipt.remainingAmount > 0) row("Balance Due", receipt.remainingAmount, true);
      doc.moveDown(0.5);

      // Payment info
      if (receipt.paymentMode) {
        doc.font("Helvetica-Bold").text("Payment Info", { underline: true });
        doc.font("Helvetica").text(`Mode: ${receipt.paymentMode.replace(/_/g, " ")}`);
        if (receipt.transactionId) doc.text(`Transaction ID: ${receipt.transactionId}`);
      }
      doc.moveDown(0.5);

      // Status badge
      doc.fontSize(12).font("Helvetica-Bold").text(`Status: ${receipt.status}`, { align: "center" });
      doc.moveDown(1);
      doc.fontSize(9).font("Helvetica").fillColor("gray")
        .text("This is a computer-generated receipt and does not require a signature.", { align: "center" });

      doc.end();
    });

    // Upload to Cloudinary as raw file
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "fee_receipts",
          resource_type: "raw",
          format: "pdf",
          public_id: `receipt-${receipt.receiptNumber}-${Date.now()}`,
        },
        (err, result) => {
          if (err) return reject(err);
          if (!result) return reject(new Error("Cloudinary: no result"));
          resolve(result);
        }
      );
      stream.end(pdfBuffer);
    });

    return { pdfUrl: uploadResult.secure_url };
  }
}

export const feesService = new FeesService();
