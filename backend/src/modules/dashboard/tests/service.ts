import { prisma } from "../../../config/db.config";
import { TestStatus, ScoreStatus, TestType } from "../../../../prisma/generated/prisma/enums";
import { sendToBatchStudents } from "../../../utils/pushNotifications";
import {
  CreateTestInput,
  UpdateTestInput,
  UploadScoreInput,
  TestResponse,
  ScoreResponse,
  GetTestsQuery,
  TestStatsResponse,
  BulkScoreResult,
} from "./types";
import { log } from "../../../utils/logtail";

const TEST_INCLUDE = {
  batch: { select: { id: true, name: true } },
  _count: { select: { scores: true } },
} as const;

const SCORE_INCLUDE = {
  student: { select: { id: true, firstname: true, lastname: true, fullname: true } },
} as const;

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

function calculateScoreFields(marksObtained: number, totalMarks: number, passingMarks: number | null): {
  percentage: number;
  grade: string;
  status: ScoreStatus;
} {
  const percentage = Math.round((marksObtained / totalMarks) * 100 * 100) / 100;
  const grade = calculateGrade(percentage);
  const status = passingMarks !== null && marksObtained < passingMarks ? ScoreStatus.FAIL : ScoreStatus.PASS;
  return { percentage, grade, status };
}

export default class TestService {
  public async create(data: CreateTestInput, userId: number): Promise<TestResponse> {
    const batch = await prisma.batch.findFirst({
      where: { id: data.batchId, isDeleted: false },
    });
    if (!batch) throw new Error("Batch not found");

    if (data.passingMarks !== undefined && data.passingMarks !== null && data.passingMarks > data.totalMarks) {
      throw new Error("Passing marks cannot exceed total marks");
    }

    const test = await prisma.test.create({
      data: {
        title: data.title,
        subject: data.subject,
        description: data.description || null,
        testType: (data.testType as TestType) || TestType.UNIT_TEST,
        batchId: data.batchId,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks ?? null,
        date: new Date(data.date),
        time: data.time || null,
        duration: data.duration ?? null,
        hall: data.hall || null,
        syllabus: data.syllabus || null,
        instructions: data.instructions || null,
        createdBy: userId,
      },
      include: TEST_INCLUDE,
    });

    // Notify students about the new test (fire-and-forget)
    const testDate = new Date(data.date).toLocaleDateString("en-IN", { dateStyle: "medium" });
    sendToBatchStudents(
      data.batchId,
      "newTestScheduled",
      "Test Scheduled",
      `${data.subject} test on ${testDate}`,
      { type: "test_scheduled", testId: test.id }
    ).catch(() => {});

    return test as unknown as TestResponse;
  }

  public async getAll(query: GetTestsQuery): Promise<{ tests: TestResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, batchId, subject, status, testType } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isDeleted: false };
    if (batchId) where.batchId = batchId;
    if (subject) where.subject = subject;
    if (status) where.status = status;
    if (testType) where.testType = testType;

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        include: TEST_INCLUDE,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.test.count({ where }),
    ]);

    return {
      tests: tests as unknown as TestResponse[],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  public async getById(id: number): Promise<TestResponse> {
    const test = await prisma.test.findFirst({
      where: { id, isDeleted: false },
      include: TEST_INCLUDE,
    });

    if (!test) throw new Error("Test not found");
    return test as unknown as TestResponse;
  }

  public async getScores(
    testId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<{ scores: ScoreResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const test = await prisma.test.findFirst({
      where: { id: testId, isDeleted: false },
      select: { id: true },
    });
    if (!test) throw new Error("Test not found");

    const skip = (page - 1) * limit;
    const [scores, total] = await Promise.all([
      prisma.testScore.findMany({
        where: { testId },
        include: SCORE_INCLUDE,
        orderBy: { marksObtained: "desc" },
        skip,
        take: limit,
      }),
      prisma.testScore.count({ where: { testId } }),
    ]);

    return {
      scores: scores as unknown as ScoreResponse[],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  public async update(id: number, data: UpdateTestInput): Promise<TestResponse> {
    const test = await prisma.test.findFirst({
      where: { id, isDeleted: false },
    });
    if (!test) throw new Error("Test not found");

    if (data.batchId) {
      const batch = await prisma.batch.findFirst({
        where: { id: data.batchId, isDeleted: false },
      });
      if (!batch) throw new Error("Batch not found");
    }

    const totalMarks = data.totalMarks ?? test.totalMarks;
    if (data.passingMarks !== undefined && data.passingMarks !== null && data.passingMarks > totalMarks) {
      throw new Error("Passing marks cannot exceed total marks");
    }

    const updated = await prisma.test.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.subject && { subject: data.subject }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.testType && { testType: data.testType as TestType }),
        ...(data.batchId && { batchId: data.batchId }),
        ...(data.totalMarks && { totalMarks: data.totalMarks }),
        ...(data.passingMarks !== undefined && { passingMarks: data.passingMarks }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.time !== undefined && { time: data.time || null }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.hall !== undefined && { hall: data.hall || null }),
        ...(data.syllabus !== undefined && { syllabus: data.syllabus || null }),
        ...(data.instructions !== undefined && { instructions: data.instructions || null }),
        ...(data.status && { status: data.status as TestStatus }),
      },
      include: TEST_INCLUDE,
    });

    return updated as unknown as TestResponse;
  }

  public async delete(id: number): Promise<void> {
    const test = await prisma.test.findFirst({
      where: { id, isDeleted: false },
    });
    if (!test) throw new Error("Test not found");

    await prisma.test.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  public async publish(id: number): Promise<TestResponse> {
    const test = await prisma.test.findFirst({
      where: { id, isDeleted: false },
    });
    if (!test) throw new Error("Test not found");

    const updated = await prisma.test.update({
      where: { id },
      data: { status: TestStatus.PUBLISHED, scoresLocked: true, publishedAt: new Date() },
      include: TEST_INCLUDE,
    });

    // Notify students that results are published (fire-and-forget)
    sendToBatchStudents(
      test.batchId,
      "resultPublished",
      "Results Published",
      `${test.subject} test results are now available`,
      { type: "result_published", testId: id }
    ).catch(() => {});

    return updated as unknown as TestResponse;
  }

  public async uploadScore(testId: number, data: UploadScoreInput, userId: number): Promise<ScoreResponse> {
    const test = await prisma.test.findFirst({
      where: { id: testId, isDeleted: false },
    });
    if (!test) throw new Error("Test not found");

    const student = await prisma.student.findFirst({
      where: { id: data.studentId, isDeleted: false },
    });
    if (!student) throw new Error("Student not found");

    // Check if score already exists
    const existing = await prisma.testScore.findUnique({
      where: { testId_studentId: { testId, studentId: data.studentId } },
    });
    if (existing) throw new Error("Score already exists for this student. Use update instead.");

    if (data.marksObtained > test.totalMarks) {
      throw new Error("Marks obtained cannot exceed total marks");
    }

    const { percentage, grade, status } = calculateScoreFields(data.marksObtained, test.totalMarks, test.passingMarks);

    const score = await prisma.testScore.create({
      data: {
        testId,
        studentId: data.studentId,
        marksObtained: data.marksObtained,
        percentage,
        grade,
        status,
        remarks: data.remarks || null,
        uploadedBy: userId,
      },
      include: SCORE_INCLUDE,
    });

    return score as unknown as ScoreResponse;
  }

  public async uploadScoresBulk(testId: number, rows: Array<{ studentId: number; marksObtained: number; remarks?: string }>, userId: number): Promise<BulkScoreResult> {
    const test = await prisma.test.findFirst({
      where: { id: testId, isDeleted: false },
    });
    if (!test) throw new Error("Test not found");

    const result: BulkScoreResult = { total: rows.length, uploaded: 0, absent: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const student = await prisma.student.findFirst({
          where: { id: row.studentId, isDeleted: false },
        });
        if (!student) {
          result.errors.push({ row: i + 1, message: `Student ID ${row.studentId} not found` });
          result.failed++;
          continue;
        }

        // Check if marked as absent (marksObtained = 0 and remarks = "ABSENT")
        const isAbsent = row.remarks?.toUpperCase() === "ABSENT";

        if (!isAbsent && row.marksObtained > test.totalMarks) {
          result.errors.push({ row: i + 1, message: `Marks ${row.marksObtained} exceeds total ${test.totalMarks}` });
          result.failed++;
          continue;
        }

        const { percentage, grade, status } = isAbsent
          ? { percentage: 0, grade: null, status: ScoreStatus.ABSENT }
          : calculateScoreFields(row.marksObtained, test.totalMarks, test.passingMarks);

        await prisma.testScore.upsert({
          where: { testId_studentId: { testId, studentId: row.studentId } },
          create: {
            testId,
            studentId: row.studentId,
            marksObtained: isAbsent ? 0 : row.marksObtained,
            percentage,
            grade,
            status,
            remarks: row.remarks || null,
            uploadedBy: userId,
          },
          update: {
            marksObtained: isAbsent ? 0 : row.marksObtained,
            percentage,
            grade,
            status,
            remarks: row.remarks || null,
            uploadedBy: userId,
          },
        });

        if (isAbsent) {
          result.absent++;
        } else {
          result.uploaded++;
        }
      } catch (error: any) {
        log("error", "dashboard.tests.upsert failed", { err: error instanceof Error ? error.message : String(error) });
        result.errors.push({ row: i + 1, message: error.message });
        result.failed++;
      }
    }

    return result;
  }

  public async updateScore(testId: number, scoreId: number, data: { marksObtained?: number; remarks?: string; status?: ScoreStatus }, userId: number): Promise<ScoreResponse> {
    const test = await prisma.test.findFirst({
      where: { id: testId, isDeleted: false },
    });
    if (!test) throw new Error("Test not found");

    const score = await prisma.testScore.findFirst({
      where: { id: scoreId, testId },
    });
    if (!score) throw new Error("Score not found");

    const marksObtained = data.marksObtained ?? score.marksObtained;
    if (marksObtained > test.totalMarks) {
      throw new Error("Marks obtained cannot exceed total marks");
    }

    let updateData: Record<string, unknown> = {
      uploadedBy: userId,
    };

    if (data.status === ScoreStatus.ABSENT) {
      updateData = {
        ...updateData,
        marksObtained: 0,
        percentage: 0,
        grade: null,
        status: ScoreStatus.ABSENT,
      };
    } else if (data.marksObtained !== undefined) {
      const calc = calculateScoreFields(data.marksObtained, test.totalMarks, test.passingMarks);
      updateData = {
        ...updateData,
        marksObtained: data.marksObtained,
        percentage: calc.percentage,
        grade: calc.grade,
        status: calc.status,
      };
    }

    if (data.remarks !== undefined) {
      updateData.remarks = data.remarks || null;
    }

    const updated = await prisma.testScore.update({
      where: { id: scoreId },
      data: updateData,
      include: SCORE_INCLUDE,
    });

    return updated as unknown as ScoreResponse;
  }

  public async getStats(testId: number): Promise<TestStatsResponse> {
    const test = await prisma.test.findFirst({
      where: { id: testId, isDeleted: false },
      include: {
        batch: { select: { id: true, name: true } },
        scores: {
          include: {
            student: { select: { id: true, fullname: true } },
          },
          orderBy: { marksObtained: "desc" },
        },
      },
    });
    if (!test) throw new Error("Test not found");

    // Count total students in the batch
    const totalStudents = await prisma.student.count({
      where: { batchId: test.batchId, isDeleted: false },
    });

    const scores = test.scores;
    const appeared = scores.filter((s) => s.status !== ScoreStatus.ABSENT).length;
    const absent = scores.filter((s) => s.status === ScoreStatus.ABSENT).length;
    const passed = scores.filter((s) => s.status === ScoreStatus.PASS).length;
    const failed = scores.filter((s) => s.status === ScoreStatus.FAIL).length;

    const nonAbsentScores = scores.filter((s) => s.status !== ScoreStatus.ABSENT);
    const marks = nonAbsentScores.map((s) => s.marksObtained);

    const average = marks.length > 0 ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 100) / 100 : 0;

    const sortedMarks = [...marks].sort((a, b) => a - b);
    const median = sortedMarks.length > 0
      ? sortedMarks.length % 2 === 0
        ? (sortedMarks[sortedMarks.length / 2 - 1] + sortedMarks[sortedMarks.length / 2]) / 2
        : sortedMarks[Math.floor(sortedMarks.length / 2)]
      : 0;

    const highest = marks.length > 0 ? Math.max(...marks) : 0;
    const lowest = marks.length > 0 ? Math.min(...marks) : 0;
    const passPercentage = appeared > 0 ? Math.round((passed / appeared) * 100 * 10) / 10 : 0;

    // Grade distribution
    const gradeDistribution: Record<string, number> = {};
    for (const s of nonAbsentScores) {
      const grade = s.grade || "N/A";
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    }

    // Top 3 scorers
    const topScorers = nonAbsentScores.slice(0, 3).map((s) => ({
      studentId: s.studentId,
      fullname: s.student.fullname,
      marks: s.marksObtained,
      percentage: s.percentage,
    }));

    return {
      testId,
      title: test.title,
      totalStudents,
      appeared,
      absent,
      passed,
      failed,
      passPercentage,
      average,
      median,
      highest,
      lowest,
      gradeDistribution,
      topScorers,
    };
  }
}
