-- CreateEnum
CREATE TYPE "AnnouncementCategory" AS ENUM ('GENERAL', 'EXAM', 'HOLIDAY', 'LECTURE', 'EVENT');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('FILE_UPLOAD', 'TEXT_ENTRY', 'BOTH');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "StudyMaterialType" AS ENUM ('DOCUMENT', 'VIDEO', 'NOTES', 'SLIDES', 'WORKSHEET');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "AutomationRuleStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "DmStatus" AS ENUM ('SENT', 'FAILED', 'RATE_LIMITED');

-- CreateEnum
CREATE TYPE "DmType" AS ENUM ('TEXT', 'TEMPLATE');

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "body" TEXT,
ADD COLUMN     "category" "AnnouncementCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "department" TEXT,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "assignment_slots" ADD COLUMN     "allowLateSubmissions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "assignmentStatus" "AssignmentStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "plagiarismCheck" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submissionType" "SubmissionType" NOT NULL DEFAULT 'FILE_UPLOAD',
ADD COLUMN     "teacherId" INTEGER;

-- AlterTable
ALTER TABLE "student_submissions" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "study_materials" ADD COLUMN     "chapter" TEXT,
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "materialStatus" "MaterialStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "materialType" "StudyMaterialType" NOT NULL DEFAULT 'DOCUMENT',
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "teacherId" INTEGER,
ADD COLUMN     "visibleBatchIds" INTEGER[];

-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "scoresLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teacherId" INTEGER;

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "classStartingSoon" BOOLEAN NOT NULL DEFAULT true,
    "timetableChanges" BOOLEAN NOT NULL DEFAULT true,
    "newTestScheduled" BOOLEAN NOT NULL DEFAULT true,
    "resultPublished" BOOLEAN NOT NULL DEFAULT true,
    "newStudyMaterial" BOOLEAN NOT NULL DEFAULT true,
    "classResourceUploaded" BOOLEAN NOT NULL DEFAULT false,
    "schoolAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "doubtResponses" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursFrom" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursTo" TEXT NOT NULL DEFAULT '07:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_accounts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "igUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profilePictureUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "followersCount" INTEGER,
    "mediaCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" SERIAL NOT NULL,
    "instagramAccountId" INTEGER NOT NULL,
    "mediaId" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaCaption" TEXT,
    "mediaType" TEXT,
    "triggerKeyword" TEXT NOT NULL,
    "dmMessage" TEXT NOT NULL,
    "dmType" "DmType" NOT NULL DEFAULT 'TEXT',
    "dmButtons" JSONB,
    "autoReplyComment" BOOLEAN NOT NULL DEFAULT false,
    "autoReplyText" TEXT,
    "status" "AutomationRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "dmsSentCount" INTEGER NOT NULL DEFAULT 0,
    "isFollowGated" BOOLEAN NOT NULL DEFAULT false,
    "unfollowedMessage" TEXT,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_logs" (
    "id" SERIAL NOT NULL,
    "ruleId" INTEGER NOT NULL,
    "commenterId" TEXT NOT NULL,
    "commenterUsername" TEXT,
    "commentText" TEXT NOT NULL,
    "dmStatus" "DmStatus" NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "schoolName" TEXT NOT NULL DEFAULT 'My Coaching',
    "schoolEmail" TEXT NOT NULL DEFAULT '',
    "schoolPhone" TEXT NOT NULL DEFAULT '',
    "schoolAddress" TEXT NOT NULL DEFAULT '',
    "schoolWebsite" TEXT NOT NULL DEFAULT '',
    "teacherPermissions" JSONB NOT NULL DEFAULT '{"canManageLectures":true,"canUploadNotes":true,"canUploadVideos":false,"canManageAssignments":true,"canViewFees":false,"canManageStudyMaterials":false,"canSendAnnouncements":true,"canViewAnalytics":false,"canExportData":false}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_studentId_key" ON "notification_preferences"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_accounts_userId_key" ON "instagram_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_accounts_igUserId_key" ON "instagram_accounts"("igUserId");

-- CreateIndex
CREATE INDEX "instagram_accounts_userId_idx" ON "instagram_accounts"("userId");

-- CreateIndex
CREATE INDEX "automation_rules_instagramAccountId_idx" ON "automation_rules"("instagramAccountId");

-- CreateIndex
CREATE INDEX "automation_rules_mediaId_idx" ON "automation_rules"("mediaId");

-- CreateIndex
CREATE INDEX "automation_rules_instagramAccountId_mediaId_triggerKeyword_idx" ON "automation_rules"("instagramAccountId", "mediaId", "triggerKeyword");

-- CreateIndex
CREATE INDEX "automation_logs_ruleId_idx" ON "automation_logs"("ruleId");

-- CreateIndex
CREATE INDEX "automation_logs_commenterId_idx" ON "automation_logs"("commenterId");

-- CreateIndex
CREATE INDEX "announcements_category_isActive_idx" ON "announcements"("category", "isActive");

-- CreateIndex
CREATE INDEX "announcements_isActive_createdAt_idx" ON "announcements"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "assignment_slots_teacherId_idx" ON "assignment_slots"("teacherId");

-- CreateIndex
CREATE INDEX "assignment_slots_groupId_idx" ON "assignment_slots"("groupId");

-- CreateIndex
CREATE INDEX "assignment_slots_assignmentStatus_isDeleted_idx" ON "assignment_slots"("assignmentStatus", "isDeleted");

-- CreateIndex
CREATE INDEX "study_materials_teacherId_idx" ON "study_materials"("teacherId");

-- CreateIndex
CREATE INDEX "study_materials_materialStatus_isDeleted_idx" ON "study_materials"("materialStatus", "isDeleted");

-- CreateIndex
CREATE INDEX "study_materials_materialType_idx" ON "study_materials"("materialType");

-- CreateIndex
CREATE INDEX "tests_teacherId_idx" ON "tests"("teacherId");

-- CreateIndex
CREATE INDEX "tests_status_isDeleted_idx" ON "tests"("status", "isDeleted");

-- AddForeignKey
ALTER TABLE "assignment_slots" ADD CONSTRAINT "assignment_slots_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "instagram_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
