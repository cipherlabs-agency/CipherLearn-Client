import { prisma } from "../../../config/db.config";
import { TestStatus, ScoreStatus } from "../../../../prisma/generated/prisma/enums";
import { AppTestResponse, AppTestDetailResponse, StudentPerformanceResponse } from "./types";

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
      include: { batch: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    });

    return tests.map((t) => ({
      ...t,
      daysUntil: getDaysUntil(t.date),
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
}
