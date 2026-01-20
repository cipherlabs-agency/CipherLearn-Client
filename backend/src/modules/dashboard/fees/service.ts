import { Prisma, PaymentStatus, FeeStructure, FeeReceipt } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import {
  CreateFeeStructureInput,
  UpdateFeeStructureInput,
  CreateFeeReceiptInput,
  UpdateFeeReceiptInput,
  BulkCreateReceiptsInput,
  FeeReceiptFilters,
  FeeReceiptSummary,
  StudentFeesSummary,
  BulkCreateResult,
  ReceiptWithRelations,
} from "./types";

export default class FeesService {
  // ============================================
  // Receipt Number Generation
  // ============================================

  /**
   * Generate unique receipt number in format: RCP-YYYY-NNNNN
   */
  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCP-${year}-`;

    // Find the latest receipt number for this year
    const latestReceipt = await prisma.feeReceipt.findFirst({
      where: {
        receiptNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        receiptNumber: "desc",
      },
      select: {
        receiptNumber: true,
      },
    });

    let nextNumber = 1;
    if (latestReceipt) {
      const lastNumber = parseInt(latestReceipt.receiptNumber.split("-")[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, "0")}`;
  }

  /**
   * Calculate remaining amount and determine status
   */
  private calculateReceiptStatus(
    totalAmount: number,
    paidAmount: number,
    discountAmount: number,
    lateFeeAmount: number,
    dueDate: Date
  ): { remainingAmount: number; status: PaymentStatus } {
    const effectiveTotal = totalAmount - discountAmount + lateFeeAmount;
    const remainingAmount = Math.max(0, effectiveTotal - paidAmount);

    let status: PaymentStatus;
    if (remainingAmount === 0) {
      status = "PAID";
    } else if (paidAmount > 0) {
      status = "PARTIAL";
    } else if (new Date() > dueDate) {
      status = "OVERDUE";
    } else {
      status = "PENDING";
    }

    return { remainingAmount, status };
  }

  // ============================================
  // Fee Structure CRUD
  // ============================================

  /**
   * Create a new fee structure for a batch
   */
  async createFeeStructure(input: CreateFeeStructureInput): Promise<FeeStructure> {
    // Verify batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: input.batchId, isDeleted: false },
    });

    if (!batch) {
      throw new Error(`Batch with ID ${input.batchId} not found`);
    }

    // Check for duplicate name in same batch
    const existing = await prisma.feeStructure.findUnique({
      where: {
        batchId_name: {
          batchId: input.batchId,
          name: input.name,
        },
      },
    });

    if (existing) {
      throw new Error(`Fee structure "${input.name}" already exists for this batch`);
    }

    return prisma.feeStructure.create({
      data: {
        batchId: input.batchId,
        name: input.name,
        amount: input.amount,
        frequency: input.frequency || "MONTHLY",
        dueDay: input.dueDay || 5,
        lateFee: input.lateFee || 0,
        gracePeriod: input.gracePeriod || 5,
        description: input.description || null,
      },
    });
  }

  /**
   * Get fee structures for a batch
   */
  async getFeeStructuresByBatch(batchId: number): Promise<FeeStructure[]> {
    return prisma.feeStructure.findMany({
      where: { batchId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Update a fee structure
   */
  async updateFeeStructure(id: number, input: UpdateFeeStructureInput): Promise<FeeStructure> {
    const existing = await prisma.feeStructure.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Fee structure with ID ${id} not found`);
    }

    // Check for duplicate name if updating name
    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.feeStructure.findUnique({
        where: {
          batchId_name: {
            batchId: existing.batchId,
            name: input.name,
          },
        },
      });

      if (duplicate) {
        throw new Error(`Fee structure "${input.name}" already exists for this batch`);
      }
    }

    return prisma.feeStructure.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete a fee structure
   */
  async deleteFeeStructure(id: number): Promise<void> {
    const existing = await prisma.feeStructure.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Fee structure with ID ${id} not found`);
    }

    // Check if there are receipts using this structure
    const receiptsCount = await prisma.feeReceipt.count({
      where: { feeStructureId: id },
    });

    if (receiptsCount > 0) {
      // Soft delete by marking inactive
      await prisma.feeStructure.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if no receipts
      await prisma.feeStructure.delete({
        where: { id },
      });
    }
  }

  // ============================================
  // Fee Receipt CRUD
  // ============================================

  /**
   * Create a single fee receipt
   */
  async createReceipt(input: CreateFeeReceiptInput): Promise<FeeReceipt> {
    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: input.studentId, isDeleted: false },
    });

    if (!student) {
      throw new Error(`Student with ID ${input.studentId} not found`);
    }

    // Verify batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: input.batchId, isDeleted: false },
    });

    if (!batch) {
      throw new Error(`Batch with ID ${input.batchId} not found`);
    }

    // Check for duplicate receipt for same student, month, year
    const existingReceipt = await prisma.feeReceipt.findFirst({
      where: {
        studentId: input.studentId,
        batchId: input.batchId,
        academicMonth: input.academicMonth,
        academicYear: input.academicYear,
      },
    });

    if (existingReceipt) {
      throw new Error(
        `Receipt already exists for student ${input.studentId} for ${input.academicMonth}/${input.academicYear}`
      );
    }

    const receiptNumber = await this.generateReceiptNumber();
    const { remainingAmount, status } = this.calculateReceiptStatus(
      input.totalAmount,
      input.paidAmount || 0,
      input.discountAmount || 0,
      input.lateFeeAmount || 0,
      new Date(input.dueDate)
    );

    return prisma.feeReceipt.create({
      data: {
        receiptNumber,
        studentId: input.studentId,
        batchId: input.batchId,
        feeStructureId: input.feeStructureId || null,
        totalAmount: input.totalAmount,
        paidAmount: input.paidAmount || 0,
        discountAmount: input.discountAmount || 0,
        lateFeeAmount: input.lateFeeAmount || 0,
        remainingAmount,
        paymentMode: input.paymentMode || null,
        transactionId: input.transactionId || null,
        chequeNumber: input.chequeNumber || null,
        bankName: input.bankName || null,
        paymentNotes: input.paymentNotes || null,
        academicMonth: input.academicMonth,
        academicYear: input.academicYear,
        status,
        dueDate: new Date(input.dueDate),
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : null,
        generatedBy: input.generatedBy,
        generatedById: input.generatedById || null,
      },
    });
  }

  /**
   * Bulk create receipts for a batch
   */
  async bulkCreateReceipts(input: BulkCreateReceiptsInput): Promise<BulkCreateResult> {
    const result: BulkCreateResult = {
      total: 0,
      created: 0,
      skipped: 0,
      errors: [],
    };

    // Get fee structure if provided
    let totalAmount = 0;
    if (input.feeStructureId) {
      const feeStructure = await prisma.feeStructure.findUnique({
        where: { id: input.feeStructureId },
      });
      if (!feeStructure) {
        throw new Error(`Fee structure with ID ${input.feeStructureId} not found`);
      }
      totalAmount = feeStructure.amount;
    }

    // Get students
    let students;
    if (input.studentIds && input.studentIds.length > 0) {
      students = await prisma.student.findMany({
        where: {
          id: { in: input.studentIds },
          batchId: input.batchId,
          isDeleted: false,
        },
      });
    } else {
      students = await prisma.student.findMany({
        where: {
          batchId: input.batchId,
          isDeleted: false,
        },
      });
    }

    result.total = students.length;

    for (const student of students) {
      try {
        // Check if receipt already exists
        const existing = await prisma.feeReceipt.findFirst({
          where: {
            studentId: student.id,
            batchId: input.batchId,
            academicMonth: input.academicMonth,
            academicYear: input.academicYear,
          },
        });

        if (existing) {
          result.skipped++;
          continue;
        }

        const receiptNumber = await this.generateReceiptNumber();
        const { remainingAmount, status } = this.calculateReceiptStatus(
          totalAmount,
          0,
          0,
          0,
          new Date(input.dueDate)
        );

        await prisma.feeReceipt.create({
          data: {
            receiptNumber,
            studentId: student.id,
            batchId: input.batchId,
            feeStructureId: input.feeStructureId || null,
            totalAmount,
            paidAmount: 0,
            discountAmount: 0,
            lateFeeAmount: 0,
            remainingAmount,
            academicMonth: input.academicMonth,
            academicYear: input.academicYear,
            status,
            dueDate: new Date(input.dueDate),
            generatedBy: input.generatedBy,
            generatedById: input.generatedById || null,
          },
        });

        result.created++;
      } catch (error: any) {
        result.errors.push(`Student ${student.id}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Get receipts with filters and pagination
   */
  async getReceipts(
    filters: FeeReceiptFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ receipts: ReceiptWithRelations[]; total: number; page: number; totalPages: number }> {
    const where: Prisma.FeeReceiptWhereInput = {};

    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.status) where.status = filters.status;
    if (filters.academicMonth) where.academicMonth = filters.academicMonth;
    if (filters.academicYear) where.academicYear = filters.academicYear;
    if (filters.paymentMode) where.paymentMode = filters.paymentMode;

    if (filters.startDate || filters.endDate) {
      where.dueDate = {};
      if (filters.startDate) where.dueDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.dueDate.lte = new Date(filters.endDate);
    }

    const [receipts, total] = await Promise.all([
      prisma.feeReceipt.findMany({
        where,
        include: {
          student: {
            select: { id: true, fullname: true, email: true },
          },
          batch: {
            select: { id: true, name: true },
          },
          feeStructure: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feeReceipt.count({ where }),
    ]);

    return {
      receipts: receipts as unknown as ReceiptWithRelations[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single receipt by ID
   */
  async getReceiptById(id: number): Promise<ReceiptWithRelations> {
    const receipt = await prisma.feeReceipt.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, fullname: true, email: true },
        },
        batch: {
          select: { id: true, name: true },
        },
        feeStructure: {
          select: { id: true, name: true },
        },
      },
    });

    if (!receipt) {
      throw new Error(`Receipt with ID ${id} not found`);
    }

    return receipt as unknown as ReceiptWithRelations;
  }

  /**
   * Update a receipt
   */
  async updateReceipt(id: number, input: UpdateFeeReceiptInput): Promise<FeeReceipt> {
    const existing = await prisma.feeReceipt.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Receipt with ID ${id} not found`);
    }

    // Calculate new values
    const paidAmount = input.paidAmount ?? existing.paidAmount;
    const discountAmount = input.discountAmount ?? existing.discountAmount;
    const lateFeeAmount = input.lateFeeAmount ?? existing.lateFeeAmount;
    const dueDate = input.dueDate ? new Date(input.dueDate) : existing.dueDate;

    const { remainingAmount, status } = this.calculateReceiptStatus(
      existing.totalAmount,
      paidAmount,
      discountAmount,
      lateFeeAmount,
      dueDate
    );

    // If status is explicitly provided, use it; otherwise use calculated
    const finalStatus = input.status || status;

    return prisma.feeReceipt.update({
      where: { id },
      data: {
        ...input,
        remainingAmount,
        status: finalStatus,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : undefined,
      },
    });
  }

  /**
   * Delete a receipt
   */
  async deleteReceipt(id: number): Promise<void> {
    const existing = await prisma.feeReceipt.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Receipt with ID ${id} not found`);
    }

    await prisma.feeReceipt.delete({
      where: { id },
    });
  }

  // ============================================
  // Summary & Reports
  // ============================================

  /**
   * Get receipts summary with statistics
   */
  async getReceiptsSummary(filters: FeeReceiptFilters): Promise<FeeReceiptSummary> {
    const where: Prisma.FeeReceiptWhereInput = {};

    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.academicYear) where.academicYear = filters.academicYear;

    const receipts = await prisma.feeReceipt.findMany({
      where,
      select: {
        totalAmount: true,
        paidAmount: true,
        remainingAmount: true,
        status: true,
        academicMonth: true,
        academicYear: true,
      },
    });

    const summary: FeeReceiptSummary = {
      totalReceipts: receipts.length,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      byStatus: {
        paid: 0,
        partial: 0,
        pending: 0,
        overdue: 0,
      },
      byMonth: [],
    };

    const monthlyData = new Map<string, { totalAmount: number; collectedAmount: number; pendingAmount: number }>();

    for (const receipt of receipts) {
      summary.totalAmount += receipt.totalAmount;
      summary.paidAmount += receipt.paidAmount;

      switch (receipt.status) {
        case "PAID":
          summary.byStatus.paid++;
          break;
        case "PARTIAL":
          summary.byStatus.partial++;
          summary.pendingAmount += receipt.remainingAmount;
          break;
        case "PENDING":
          summary.byStatus.pending++;
          summary.pendingAmount += receipt.remainingAmount;
          break;
        case "OVERDUE":
          summary.byStatus.overdue++;
          summary.overdueAmount += receipt.remainingAmount;
          break;
      }

      // Aggregate by month
      const monthKey = `${receipt.academicYear}-${receipt.academicMonth}`;
      const existingMonth = monthlyData.get(monthKey) || { totalAmount: 0, collectedAmount: 0, pendingAmount: 0 };
      existingMonth.totalAmount += receipt.totalAmount;
      existingMonth.collectedAmount += receipt.paidAmount;
      existingMonth.pendingAmount += receipt.remainingAmount;
      monthlyData.set(monthKey, existingMonth);
    }

    // Convert monthly data to array
    summary.byMonth = Array.from(monthlyData.entries()).map(([key, data]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        month,
        year,
        ...data,
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    return summary;
  }

  /**
   * Get student fees summary
   */
  async getStudentFeesSummary(studentId: number): Promise<StudentFeesSummary> {
    const student = await prisma.student.findUnique({
      where: { id: studentId, isDeleted: false },
      include: {
        batch: {
          select: { name: true },
        },
      },
    });

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    const receipts = await prisma.feeReceipt.findMany({
      where: { studentId },
      select: {
        totalAmount: true,
        paidAmount: true,
        remainingAmount: true,
        status: true,
        paymentDate: true,
      },
      orderBy: { paymentDate: "desc" },
    });

    let totalDue = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let overdueReceipts = 0;
    let lastPaymentDate: Date | undefined;

    for (const receipt of receipts) {
      totalDue += receipt.totalAmount;
      totalPaid += receipt.paidAmount;
      totalPending += receipt.remainingAmount;

      if (receipt.status === "OVERDUE") {
        overdueReceipts++;
      }

      if (receipt.paymentDate && (!lastPaymentDate || receipt.paymentDate > lastPaymentDate)) {
        lastPaymentDate = receipt.paymentDate;
      }
    }

    return {
      studentId,
      studentName: student.fullname,
      email: student.email,
      batchName: student.batch?.name || "No Batch",
      totalDue,
      totalPaid,
      totalPending,
      overdueReceipts,
      lastPaymentDate,
    };
  }

  /**
   * Get receipts for a specific student (for student view)
   */
  async getStudentReceipts(studentId: number): Promise<ReceiptWithRelations[]> {
    const receipts = await prisma.feeReceipt.findMany({
      where: { studentId },
      include: {
        student: {
          select: { id: true, fullname: true, email: true },
        },
        batch: {
          select: { id: true, name: true },
        },
        feeStructure: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { academicYear: "desc" },
        { academicMonth: "desc" },
      ],
    });

    return receipts as unknown as ReceiptWithRelations[];
  }

  /**
   * Mark overdue receipts
   */
  async markOverdueReceipts(): Promise<number> {
    const result = await prisma.feeReceipt.updateMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: new Date(),
        },
      },
      data: {
        status: "OVERDUE",
      },
    });

    return result.count;
  }
}
