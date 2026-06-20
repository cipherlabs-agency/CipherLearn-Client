/*
  Warnings:

  - You are about to drop the column `attendance` on the `students` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `qr_attendance_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "attendance";

-- CreateIndex
CREATE INDEX "notes_batchId_idx" ON "notes"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_attendance_tokens_token_key" ON "qr_attendance_tokens"("token");

-- CreateIndex
CREATE INDEX "youtube_videos_batchId_idx" ON "youtube_videos"("batchId");

-- AddForeignKey
ALTER TABLE "youtube_videos" ADD CONSTRAINT "youtube_videos_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_accounts" ADD CONSTRAINT "instagram_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
