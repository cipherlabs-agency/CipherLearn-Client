import { PaymentStatus, PaymentMode, FeeFrequency } from "../../../../prisma/generated/prisma/client";

export interface TeacherStudentFeeItem {
  id: number;
  fullname: string;
  rollNumber: string | null;
  batch: { id: number; name: string } | null;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string | null;
  status: PaymentStatus;
}

export interface TeacherStudentFeeDetail {
  student: {
    id: number;
    fullname: string;
    rollNumber: string | null;
    phone: string | null;
    parentName: string | null;
    batch: { id: number; name: string } | null;
  };
  receipts: AppFeeReceipt[];
  summary: AppFeesSummary;
}

export interface AppFeeReceipt {
  id: number;
  receiptNumber: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  discountAmount: number;
  lateFeeAmount: number;
  status: PaymentStatus;
  academicMonth: number;
  academicYear: number;
  dueDate: string;
  paymentDate: string | null;
  paymentMode: PaymentMode | null;
  feeName: string | null;
}

export interface AppFeesSummary {
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  receiptsCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface AppFeeStructure {
  id: number;
  name: string;
  amount: number;
  frequency: FeeFrequency;
  dueDay: number;
  lateFee: number;
  gracePeriod: number;
  description: string | null;
}
