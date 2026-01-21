import { prisma } from "../../../config/db.config";
import { PaymentStatus } from "../../../../prisma/generated/prisma/client";
import type { AppFeeReceipt, AppFeesSummary } from "./types";

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
}

export const feesService = new FeesService();
