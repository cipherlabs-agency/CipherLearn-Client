-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ALERT');

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "targetBatchIds" INTEGER[];

-- AlterTable
ALTER TABLE "fee_receipts" ADD COLUMN     "pdfUrl" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "avatarUrl" TEXT;

-- AlterTable
ALTER TABLE "study_materials" ADD COLUMN     "folderId" INTEGER;

-- AlterTable
ALTER TABLE "teacher_profiles" ADD COLUMN     "avatarUrl" TEXT;

-- AlterTable
ALTER TABLE "youtube_videos" ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "visibleBatchIds" INTEGER[];

-- CreateTable
CREATE TABLE "landing_pages" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "theme" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "batchId" INTEGER NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_folders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "batchId" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_reminders" (
    "id" SERIAL NOT NULL,
    "testId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_batchId_key" ON "landing_pages"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_slug_key" ON "landing_pages"("slug");

-- CreateIndex
CREATE INDEX "material_folders_batchId_idx" ON "material_folders"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "material_folders_batchId_name_key" ON "material_folders"("batchId", "name");

-- CreateIndex
CREATE INDEX "test_reminders_testId_idx" ON "test_reminders"("testId");

-- CreateIndex
CREATE INDEX "test_reminders_userId_idx" ON "test_reminders"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "test_reminders_testId_userId_key" ON "test_reminders"("testId", "userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "announcements_isActive_isDraft_scheduledAt_idx" ON "announcements"("isActive", "isDraft", "scheduledAt");

-- CreateIndex
CREATE INDEX "announcements_createdById_idx" ON "announcements"("createdById");

-- CreateIndex
CREATE INDEX "doubts_batchId_status_idx" ON "doubts"("batchId", "status");

-- CreateIndex
CREATE INDEX "fee_receipts_studentId_status_idx" ON "fee_receipts"("studentId", "status");

-- CreateIndex
CREATE INDEX "fee_receipts_batchId_academicYear_academicMonth_idx" ON "fee_receipts"("batchId", "academicYear", "academicMonth");

-- CreateIndex
CREATE INDEX "lectures_batchId_isDeleted_date_idx" ON "lectures"("batchId", "isDeleted", "date");

-- CreateIndex
CREATE INDEX "lectures_teacherId_isDeleted_date_idx" ON "lectures"("teacherId", "isDeleted", "date");

-- CreateIndex
CREATE INDEX "notes_batchId_isDeleted_idx" ON "notes"("batchId", "isDeleted");

-- CreateIndex
CREATE INDEX "student_submissions_studentId_status_idx" ON "student_submissions"("studentId", "status");

-- CreateIndex
CREATE INDEX "students_batchId_isDeleted_idx" ON "students"("batchId", "isDeleted");

-- CreateIndex
CREATE INDEX "students_isDeleted_createdAt_idx" ON "students"("isDeleted", "createdAt");

-- CreateIndex
CREATE INDEX "study_materials_folderId_idx" ON "study_materials"("folderId");

-- CreateIndex
CREATE INDEX "test_scores_testId_marksObtained_idx" ON "test_scores"("testId", "marksObtained");

-- CreateIndex
CREATE INDEX "tests_isDeleted_date_idx" ON "tests"("isDeleted", "date");

-- CreateIndex
CREATE INDEX "youtube_videos_batchId_isDeleted_idx" ON "youtube_videos"("batchId", "isDeleted");

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_folders" ADD CONSTRAINT "material_folders_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "material_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_reminders" ADD CONSTRAINT "test_reminders_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
