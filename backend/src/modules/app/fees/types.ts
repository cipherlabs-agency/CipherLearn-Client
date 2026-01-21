import { PaymentStatus, PaymentMode } from "../../../../prisma/generated/prisma/client";

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
