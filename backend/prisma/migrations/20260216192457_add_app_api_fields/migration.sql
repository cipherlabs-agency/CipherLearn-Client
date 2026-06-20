-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'LATE';

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "lectureId" INTEGER,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "grade" TEXT,
ADD COLUMN     "instituteId" TEXT,
ADD COLUMN     "parentName" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE INDEX "attendances_lectureId_idx" ON "attendances"("lectureId");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
