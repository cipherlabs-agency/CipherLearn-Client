-- CreateEnum
CREATE TYPE "LectureStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('UNIT_TEST', 'MIDTERM', 'FINAL', 'QUIZ', 'PRACTICE');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ScoreStatus" AS ENUM ('PASS', 'FAIL', 'ABSENT');

-- CreateTable
CREATE TABLE "lectures" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "room" TEXT,
    "batchId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "assignedBy" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "LectureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "recurrenceId" TEXT,
    "createdBy" INTEGER NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "testType" "TestType" NOT NULL DEFAULT 'UNIT_TEST',
    "batchId" INTEGER NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "passingMarks" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "duration" INTEGER,
    "hall" TEXT,
    "syllabus" TEXT,
    "instructions" TEXT,
    "status" "TestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" INTEGER NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_scores" (
    "id" SERIAL NOT NULL,
    "testId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "marksObtained" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "grade" TEXT,
    "status" "ScoreStatus" NOT NULL DEFAULT 'PASS',
    "remarks" TEXT,
    "uploadedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lectures_batchId_idx" ON "lectures"("batchId");

-- CreateIndex
CREATE INDEX "lectures_teacherId_idx" ON "lectures"("teacherId");

-- CreateIndex
CREATE INDEX "lectures_date_idx" ON "lectures"("date");

-- CreateIndex
CREATE INDEX "lectures_batchId_date_idx" ON "lectures"("batchId", "date");

-- CreateIndex
CREATE INDEX "tests_batchId_idx" ON "tests"("batchId");

-- CreateIndex
CREATE INDEX "tests_batchId_date_idx" ON "tests"("batchId", "date");

-- CreateIndex
CREATE INDEX "test_scores_testId_idx" ON "test_scores"("testId");

-- CreateIndex
CREATE INDEX "test_scores_studentId_idx" ON "test_scores"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "test_scores_testId_studentId_key" ON "test_scores"("testId", "studentId");

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_scores" ADD CONSTRAINT "test_scores_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_scores" ADD CONSTRAINT "test_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
