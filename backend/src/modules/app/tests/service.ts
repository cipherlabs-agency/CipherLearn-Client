import { prisma } from "../../../config/db.config";
import {
  TestStatus,
  ScoreStatus,
} from "../../../../prisma/generated/prisma/enums";
import type { Prisma } from "../../../../prisma/generated/prisma/client";
import type {
  AppTestResponse,
  AppTestDetailResponse,
  StudentPerformanceResponse,
  TeacherTestListItem,
  TestGradingStatus,
  ScoreSheetEntry,
  BulkSaveScoreInput,
  TestSummary,
  GetTeacherTestsQuery,
} from "./types";

function getDaysUntil(testDate: Date): number | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tDate = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());
  const diff = tDate.getTime() - today.getTime();
  if (diff < 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default class AppTestService {
  public async getStudentTests(studentId: number, batchId: number, filter?: string): Promise<AppTestResponse[]> {
    const where: Record<string, unknown> = {
      batchId,
      isDeleted: false,
      status: { in: [TestStatus.SCHEDULED, TestStatus.ONGOING, TestStatus.COMPLETED, TestStatus.PUBLISHED] },
    };

    if (filter === "upcoming") {
      where.date = { gte: new Date() };
      where.status = { in: [TestStatus.SCHEDULED, TestStatus.ONGOING] };
    } else if (filter === "complete") {
      where.status = { in: [TestStatus.COMPLETED, TestStatus.PUBLISHED] };
    } else if (filter === "results") {
      where.status = TestStatus.PUBLISHED;
    }

    const tests = await prisma.test.findMany({
      where,
      include: {
        batch: { select: { id: true, name: true } },
        reminders: { where: { userId: studentId }, select: { id: true } },
      },
      orderBy: { date: "desc" },
    });

    return tests.map((t) => ({
      ...t,
      daysUntil: getDaysUntil(t.date),
      isReminderSet: t.reminders.length > 0,
    }));
  }

  public async getTestDetail(testId: number, studentId: number): Promise<AppTestDetailResponse> {
    const test = await prisma.test.findFirst({
      where: {
        id: testId,
        isDeleted: false,
        status: { in: [TestStatus.SCHEDULED, TestStatus.ONGOING, TestStatus.COMPLETED, TestStatus.PUBLISHED] },
      },
      include: { batch: { select: { id: true, name: true } } },
    });

    if (!test) throw new Error("Test not found");

    let myScore: AppTestDetailResponse["myScore"] = null;

    if (test.status === TestStatus.PUBLISHED) {
      const score = await prisma.testScore.findUnique({
        where: { testId_studentId: { testId, studentId } },
        include: {
          test: { select: { id: true } },
        },
      });

      if (score) {
        const uploader = await prisma.user.findUnique({
          where: { id: score.uploadedBy },
          select: { name: true },
        });

        myScore = {
          id: score.id,
          marksObtained: score.marksObtained,
          percentage: score.percentage,
          grade: score.grade,
          status: score.status,
          remarks: score.remarks,
          checkedBy: uploader?.name || "Unknown",
        };
      }
    }

    return {
      ...test,
      daysUntil: getDaysUntil(test.date),
      myScore,
    };
  }

  public async getStudentPerformance(studentId: number): Promise<StudentPerformanceResponse> {
    const scores = await prisma.testScore.findMany({
      where: {
        studentId,
        status: { not: ScoreStatus.ABSENT },
        test: { status: TestStatus.PUBLISHED, isDeleted: false },
      },
      include: {
        test: { select: { title: true, subject: true, date: true } },
      },
      orderBy: { test: { date: "asc" } },
    });

    if (scores.length === 0) {
      return {
        overallAverage: 0,
        totalTests: 0,
        passed: 0,
        failed: 0,
        highestScore: null,
        lowestScore: null,
        subjectWise: [],
        trend: [],
      };
    }

    const allScores = await prisma.testScore.findMany({
      where: {
        studentId,
        test: { status: TestStatus.PUBLISHED, isDeleted: false },
      },
    });

    const totalTests = allScores.length;
    const passed = allScores.filter((s) => s.status === ScoreStatus.PASS).length;
    const failed = allScores.filter((s) => s.status === ScoreStatus.FAIL).length;
    const overallAverage = scores.length > 0
      ? Math.round((scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length) * 100) / 100
      : 0;

    // Highest and lowest
    const sorted = [...scores].sort((a, b) => b.percentage - a.percentage);
    const highestScore = sorted[0]
      ? { test: sorted[0].test.title, percentage: sorted[0].percentage }
      : null;
    const lowestScore = sorted[sorted.length - 1]
      ? { test: sorted[sorted.length - 1].test.title, percentage: sorted[sorted.length - 1].percentage }
      : null;

    // Subject-wise
    const subjectMap = new Map<string, { total: number; count: number }>();
    for (const s of scores) {
      const subject = s.test.subject;
      const existing = subjectMap.get(subject) || { total: 0, count: 0 };
      existing.total += s.percentage;
      existing.count += 1;
      subjectMap.set(subject, existing);
    }
    const subjectWise = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      average: Math.round((data.total / data.count) * 100) / 100,
      tests: data.count,
    }));

    // Trend
    const trend = scores.map((s) => ({
      test: s.test.title,
      date: s.test.date.toISOString().split("T")[0],
      percentage: s.percentage,
    }));

    return {
      overallAverage,
      totalTests,
      passed,
      failed,
      highestScore,
      lowestScore,
      subjectWise,
      trend,
    };
  }

  public async getTeacherBatchTests(batchId: number): Promise<AppTestResponse[]> {
    const tests = await prisma.test.findMany({
      where: { batchId, isDeleted: false },
      include: { batch: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    });

    return tests.map((t) => ({
      ...t,
      daysUntil: getDaysUntil(t.date),
    }));
  }

  public async getTeacherTestScores(testId: number): Promise<{
    test: { id: number; title: string; subject: string; totalMarks: number };
    scores: Array<{
      id: number;
      studentId: number;
      student: { id: number; fullname: string };
      marksObtained: number;
      percentage: number;
      grade: string | null;
      status: ScoreStatus;
      remarks: string | null;
    }>;
  }> {
    const test = await prisma.test.findFirst({
      where: { id: testId, isDeleted: false },
      select: { id: true, title: true, subject: true, totalMarks: true },
    });

    if (!test) throw new Error("Test not found");

    const scores = await prisma.testScore.findMany({
      where: { testId },
      include: {
        student: { select: { id: true, fullname: true } },
      },
      orderBy: { marksObtained: "desc" },
    });

    return { test, scores };
  }

  // ==================== TEACHER (NEW) METHODS ====================

  /**
   * Get teacher's tests with filters and grading status
   */
  public async getTeacherTests(
    teacherId: number,
    query: GetTeacherTestsQuery
  ): Promise<{ tests: TeacherTestListItem[]; pagination: object }> {
    const { batchId, subject, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TestWhereInput = {
      teacherId,
      isDeleted: false,
    };
    if (batchId) where.batchId = batchId;
    if (subject) where.subject = { contains: subject, mode: "insensitive" };
    if (status) where.status = status;

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          batch: { select: { id: true, name: true } },
          _count: { select: { scores: true } },
        },
      }),
      prisma.test.count({ where }),
    ]);

    // Get student count per batch
    const batchIds = [...new Set(tests.map((t) => t.batchId))];
    const studentCounts = await prisma.student.groupBy({
      by: ["batchId"],
      where: {
        batchId: { in: batchIds as number[] },
        isDeleted: false,
      },
      _count: { id: true },
    });
    const countMap = new Map(studentCounts.map((sc) => [sc.batchId, sc._count.id]));

    const items: TeacherTestListItem[] = tests.map((t) => {
      const totalStudents = countMap.get(t.batchId) ?? 0;
      const gradedCount = t._count.scores;
      let gradingStatus: TestGradingStatus = "DRAFT";
      if (t.status === TestStatus.PUBLISHED) {
        gradingStatus = "GRADED";
      } else if (
        t.status === TestStatus.COMPLETED ||
        t.status === TestStatus.ONGOING
      ) {
        gradingStatus = gradedCount > 0 && gradedCount >= totalStudents
          ? "GRADED"
          : "GRADING_PENDING";
      }

      return {
        id: t.id,
        title: t.title,
        subject: t.subject,
        description: t.description,
        testType: t.testType,
        totalMarks: t.totalMarks,
        passingMarks: t.passingMarks,
        date: t.date,
        time: t.time,
        duration: t.duration,
        status: t.status,
        scoresLocked: t.scoresLocked,
        publishedAt: t.publishedAt?.toISOString() || null,
        batch: t.batch,
        gradingStatus,
        gradedCount,
        totalStudents,
        daysUntil: getDaysUntil(t.date),
      };
    });

    return {
      tests: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get score sheet for a test (all students with UNGRADED for missing)
   * Teacher must own the test.
   */
  public async getScoreSheet(
    testId: number,
    teacherId: number
  ): Promise<{
    test: { id: number; title: string; subject: string; totalMarks: number; scoresLocked: boolean };
    entries: ScoreSheetEntry[];
  }> {
    const test = await prisma.test.findFirst({
      where: { id: testId, teacherId, isDeleted: false },
      select: {
        id: true,
        title: true,
        subject: true,
        totalMarks: true,
        batchId: true,
        scoresLocked: true,
      },
    });

    if (!test) throw new Error("Test not found or access denied");

    const [students, scores] = await Promise.all([
      prisma.student.findMany({
        where: { batchId: test.batchId, isDeleted: false },
        select: { id: true, fullname: true },
        orderBy: { fullname: "asc" },
      }),
      prisma.testScore.findMany({
        where: { testId },
        select: {
          id: true,
          studentId: true,
          marksObtained: true,
          percentage: true,
          grade: true,
          status: true,
          remarks: true,
        },
      }),
    ]);

    const scoreMap = new Map(scores.map((s) => [s.studentId, s]));

    const entries: ScoreSheetEntry[] = students.map((student) => {
      const score = scoreMap.get(student.id);
      return {
        studentId: student.id,
        fullname: student.fullname,
        marksObtained: score?.marksObtained ?? null,
        percentage: score?.percentage ?? null,
        grade: score?.grade ?? null,
        status: score?.status ?? null,
        remarks: score?.remarks ?? null,
        scoreId: score?.id ?? null,
      };
    });

    return { test, entries };
  }

  /**
   * Bulk save/update scores for a test.
   * Computes percentage, grade, pass/fail automatically.
   * Returns count of saved scores.
   */
  public async bulkSaveScores(
    testId: number,
    teacherId: number,
    scores: BulkSaveScoreInput[]
  ): Promise<{ saved: number }> {
    const test = await prisma.test.findFirst({
      where: { id: testId, teacherId, isDeleted: false },
      select: { totalMarks: true, passingMarks: true, scoresLocked: true },
    });

    if (!test) throw new Error("Test not found or access denied");
    if (test.scoresLocked) throw new Error("Scores are locked after publishing results");

    const passingThreshold = test.passingMarks ?? test.totalMarks * 0.35;

    const computeGrade = (percentage: number): string => {
      if (percentage >= 90) return "A+";
      if (percentage >= 80) return "A";
      if (percentage >= 70) return "B+";
      if (percentage >= 60) return "B";
      if (percentage >= 50) return "C";
      if (percentage >= 40) return "D";
      return "F";
    };

    await prisma.$transaction(
      scores.map((s) => {
        if (s.marksObtained > test.totalMarks) {
          throw new Error(
            `Marks ${s.marksObtained} exceed total marks ${test.totalMarks} for student ${s.studentId}`
          );
        }
        const percentage =
          Math.round((s.marksObtained / test.totalMarks) * 10000) / 100;
        const grade = computeGrade(percentage);
        const status: ScoreStatus =
          s.marksObtained >= passingThreshold ? ScoreStatus.PASS : ScoreStatus.FAIL;

        return prisma.testScore.upsert({
          where: { testId_studentId: { testId, studentId: s.studentId } },
          create: {
            testId,
            studentId: s.studentId,
            marksObtained: s.marksObtained,
            percentage,
            grade,
            status,
            remarks: s.remarks ?? null,
            uploadedBy: teacherId,
          },
          update: {
            marksObtained: s.marksObtained,
            percentage,
            grade,
            status,
            remarks: s.remarks ?? null,
          },
        });
      })
    );

    return { saved: scores.length };
  }

  /**
   * Publish test results: set status=PUBLISHED, scoresLocked=true, publishedAt=now.
   * Teacher must own the test and it cannot already be published.
   */
  public async publishTestResults(
    testId: number,
    teacherId: number
  ): Promise<TestSummary> {
    const test = await prisma.test.findFirst({
      where: { id: testId, teacherId, isDeleted: false },
      select: {
        id: true,
        title: true,
        subject: true,
        totalMarks: true,
        batchId: true,
        status: true,
        scoresLocked: true,
      },
    });

    if (!test) throw new Error("Test not found or access denied");
    if (test.status === TestStatus.PUBLISHED) {
      throw new Error("Results have already been published");
    }

    await prisma.test.update({
      where: { id: testId },
      data: {
        status: TestStatus.PUBLISHED,
        scoresLocked: true,
        publishedAt: new Date(),
      },
    });

    return this.getTestSummary(testId, teacherId);
  }

  /**
   * Get test result summary (averages, highest/lowest, distribution)
   */
  public async getTestSummary(
    testId: number,
    teacherId: number
  ): Promise<TestSummary> {
    const test = await prisma.test.findFirst({
      where: { id: testId, teacherId, isDeleted: false },
      select: {
        id: true,
        title: true,
        subject: true,
        totalMarks: true,
        batchId: true,
      },
    });

    if (!test) throw new Error("Test not found or access denied");

    const [totalStudents, scores] = await Promise.all([
      prisma.student.count({ where: { batchId: test.batchId, isDeleted: false } }),
      prisma.testScore.findMany({
        where: { testId },
        include: { student: { select: { fullname: true } } },
      }),
    ]);

    const gradedCount = scores.length;
    const ungradedCount = Math.max(0, totalStudents - gradedCount);

    const sortedByMarks = [...scores].sort(
      (a, b) => b.marksObtained - a.marksObtained
    );

    const classAverage =
      gradedCount > 0
        ? Math.round(
            (scores.reduce((sum, s) => sum + s.percentage, 0) / gradedCount) * 100
          ) / 100
        : 0;

    const highest = sortedByMarks[0]
      ? {
          studentName: sortedByMarks[0].student.fullname,
          marks: sortedByMarks[0].marksObtained,
          percentage: sortedByMarks[0].percentage,
        }
      : null;

    const lowest = sortedByMarks[sortedByMarks.length - 1]
      ? {
          studentName: sortedByMarks[sortedByMarks.length - 1].student.fullname,
          marks: sortedByMarks[sortedByMarks.length - 1].marksObtained,
          percentage: sortedByMarks[sortedByMarks.length - 1].percentage,
        }
      : null;

    // Grade distribution
    const ranges = [
      { label: "90-100%", min: 90, max: 100 },
      { label: "75-89%", min: 75, max: 89 },
      { label: "60-74%", min: 60, max: 74 },
      { label: "40-59%", min: 40, max: 59 },
      { label: "0-39%", min: 0, max: 39 },
    ];
    const distribution = ranges.map((r) => ({
      range: r.label,
      count: scores.filter((s) => s.percentage >= r.min && s.percentage <= r.max)
        .length,
    }));

    return {
      testId,
      title: test.title,
      subject: test.subject,
      totalMarks: test.totalMarks,
      totalStudents,
      gradedCount,
      ungradedCount,
      classAverage,
      highestScore: highest,
      lowestScore: lowest,
      distribution,
    };
  }

  /**
   * Build a CSV string of all student scores for a test (teacher export).
   */
  async exportScoresCsv(testId: number, teacherId: number): Promise<{ csv: string; filename: string }> {
    const test = await prisma.test.findFirst({
      where: { id: testId, teacherId },
      select: { id: true, title: true, subject: true, totalMarks: true, passingMarks: true },
    });

    if (!test) throw new Error("Test not found");

    const scores = await prisma.testScore.findMany({
      where: { testId },
      include: {
        student: { select: { fullname: true } },
      },
      orderBy: { student: { fullname: "asc" } },
    });

    const header = ["Student Name", "Marks Obtained", "Total Marks", "Percentage", "Grade", "Status"].join(",");

    const rows = scores.map((s, idx) => {
      const marks = s.marksObtained !== null ? s.marksObtained : "";
      const pct = s.marksObtained !== null ? ((s.marksObtained / test.totalMarks) * 100).toFixed(2) : "";
      const grade = s.grade ?? "";
      const status =
        s.marksObtained === null
          ? "PENDING"
          : test.passingMarks !== null && s.marksObtained >= test.passingMarks
          ? "PASS"
          : "FAIL";
      return [
        `"${s.student.fullname.replace(/"/g, '""')}"`,
        marks,
        test.totalMarks,
        pct,
        grade,
        status,
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const filename = `test-${testId}-scores.csv`;
    return { csv, filename };
  }

  // ==================== TEST REMINDERS ====================

  public async toggleReminder(testId: number, userId: number): Promise<{ isReminderSet: boolean }> {
    const existing = await (prisma as any).testReminder.findUnique({
      where: { testId_userId: { testId, userId } },
    });
    if (existing) {
      await (prisma as any).testReminder.delete({ where: { testId_userId: { testId, userId } } });
      return { isReminderSet: false };
    } else {
      await (prisma as any).testReminder.create({ data: { testId, userId } });
      return { isReminderSet: true };
    }
  }

  public async removeReminder(testId: number, userId: number): Promise<void> {
    await (prisma as any).testReminder.deleteMany({ where: { testId, userId } });
  }
}
