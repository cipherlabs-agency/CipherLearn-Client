-- CreateTable
CREATE TABLE "qr_attendance_tokens" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "qr_attendance_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qr_attendance_tokens_batchId_date_idx" ON "qr_attendance_tokens"("batchId", "date");

-- CreateIndex
CREATE INDEX "qr_attendance_tokens_token_idx" ON "qr_attendance_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "qr_attendance_tokens_batchId_date_key" ON "qr_attendance_tokens"("batchId", "date");

-- AddForeignKey
ALTER TABLE "qr_attendance_tokens" ADD CONSTRAINT "qr_attendance_tokens_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
