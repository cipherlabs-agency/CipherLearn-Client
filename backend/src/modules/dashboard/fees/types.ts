import { PaymentStatus, PaymentMode, FeeFrequency } from "../../../../prisma/generated/prisma/client";

// ============================================
// Fee Structure Types
// ============================================

export interface CreateFeeStructureInput {
  batchId: number;
  name: string;
  amount: number;
  frequency?: FeeFrequency;
  dueDay?: number;
  lateFee?: number;
  gracePeriod?: number;
  description?: string;
}

export interface UpdateFeeStructureInput {
  name?: string;
  amount?: number;
  frequency?: FeeFrequency;
  dueDay?: number;
  lateFee?: number;
  gracePeriod?: number;
  isActive?: boolean;
  description?: string;
}

// ============================================
// Fee Receipt Types
// ============================================

export interface CreateFeeReceiptInput {
  studentId: number;
  batchId: number;
  feeStructureId?: number;
  totalAmount: number;
  paidAmount?: number;
  discountAmount?: number;
  lateFeeAmount?: number;
  paymentMode?: PaymentMode;
  transactionId?: string;
  chequeNumber?: string;
  bankName?: string;
  paymentNotes?: string;
  academicMonth: number;
  academicYear: number;
  dueDate: Date;
  paymentDate?: Date;
  generatedBy: string;
  generatedById?: number;
}

export interface UpdateFeeReceiptInput {
  paidAmount?: number;
  discountAmount?: number;
  lateFeeAmount?: number;
  paymentMode?: PaymentMode;
  transactionId?: string;
  chequeNumber?: string;
  bankName?: string;
  paymentNotes?: string;
  dueDate?: Date;
  paymentDate?: Date;
  status?: PaymentStatus;
  modifiedBy?: string;
  modifiedById?: number;
}

export interface BulkCreateReceiptsInput {
  batchId: number;
  feeStructureId?: number;
  academicMonth: number;
  academicYear: number;
  dueDate: Date;
  studentIds?: number[]; // If not provided, create for all students in batch
  generatedBy: string;
  generatedById?: number;
}

// ============================================
// Filter & Query Types
// ============================================

export interface FeeReceiptFilters {
  batchId?: number;
  studentId?: number;
  status?: PaymentStatus;
  academicMonth?: number;
  academicYear?: number;
  startDate?: Date;
  endDate?: Date;
  paymentMode?: PaymentMode;
}

export interface FeeReceiptSummary {
  totalReceipts: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  byStatus: {
    paid: number;
    partial: number;
    pending: number;
    overdue: number;
  };
  byMonth: {
    month: number;
    year: number;
    totalAmount: number;
    collectedAmount: number;
    pendingAmount: number;
  }[];
}

export interface StudentFeesSummary {
  studentId: number;
  studentName: string;
  email: string;
  batchName: string;
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  overdueReceipts: number;
  lastPaymentDate?: Date;
}

// ============================================
// Response Types
// ============================================

export interface BulkCreateResult {
  total: number;
  created: number;
  skipped: number;
  errors: string[];
}

export interface ReceiptWithRelations {
  id: number;
  receiptNumber: string;
  student: {
    id: number;
    fullname: string;
    email: string;
  };
  batch: {
    id: number;
    name: string;
  };
  feeStructure?: {
    id: number;
    name: string;
  } | null;
  totalAmount: number;
  paidAmount: number;
  discountAmount: number;
  lateFeeAmount: number;
  remainingAmount: number;
  paymentMode: PaymentMode | null;
  transactionId: string | null;
  chequeNumber: string | null;
  bankName: string | null;
  paymentNotes: string | null;
  academicMonth: number;
  academicYear: number;
  status: PaymentStatus;
  dueDate: Date;
  paymentDate: Date | null;
  generatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
