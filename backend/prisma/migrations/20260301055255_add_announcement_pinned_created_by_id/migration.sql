-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false;
