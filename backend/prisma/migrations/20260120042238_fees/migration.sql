-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PARTIAL', 'PENDING', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE');

-- CreateEnum
CREATE TYPE "FeeFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'ONE_TIME');

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" "FeeFrequency" NOT NULL DEFAULT 'MONTHLY',
    "dueDay" INTEGER NOT NULL DEFAULT 5,
    "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gracePeriod" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_receipts" (
    "id" SERIAL NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "feeStructureId" INTEGER,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMode" "PaymentMode",
    "transactionId" TEXT,
    "chequeNumber" TEXT,
    "bankName" TEXT,
    "paymentNotes" TEXT,
    "academicMonth" INTEGER NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "generatedBy" TEXT NOT NULL,
    "generatedById" INTEGER,
    "modifiedBy" TEXT,
    "modifiedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_structures_batchId_idx" ON "fee_structures"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_structures_batchId_name_key" ON "fee_structures"("batchId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "fee_receipts_receiptNumber_key" ON "fee_receipts"("receiptNumber");

-- CreateIndex
CREATE INDEX "fee_receipts_studentId_idx" ON "fee_receipts"("studentId");

-- CreateIndex
CREATE INDEX "fee_receipts_batchId_idx" ON "fee_receipts"("batchId");

-- CreateIndex
CREATE INDEX "fee_receipts_status_idx" ON "fee_receipts"("status");

-- CreateIndex
CREATE INDEX "fee_receipts_academicMonth_academicYear_idx" ON "fee_receipts"("academicMonth", "academicYear");

-- CreateIndex
CREATE INDEX "fee_receipts_dueDate_idx" ON "fee_receipts"("dueDate");

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "fee_structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
