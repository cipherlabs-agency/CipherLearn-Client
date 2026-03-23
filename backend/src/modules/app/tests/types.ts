import { TestType, TestStatus, ScoreStatus } from "../../../../prisma/generated/prisma/enums";

export interface AppTestResponse {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  testType: TestType;
  totalMarks: number;
  passingMarks: number | null;
  date: Date;
  time: string | null;
  duration: number | null;
  hall: string | null;
  syllabus: string | null;
  instructions: string | null;
  status: TestStatus;
  batch: { id: number; name: string };
  daysUntil: number | null;
  isReminderSet?: boolean;
}

export interface AppTestDetailResponse extends AppTestResponse {
  myScore?: {
    id: number;
    marksObtained: number;
    percentage: number;
    grade: string | null;
    status: ScoreStatus;
    remarks: string | null;
    checkedBy: string;
  } | null;
}

export interface StudentPerformanceResponse {
  overallAverage: number;
  totalTests: number;
  passed: number;
  failed: number;
  highestScore: { test: string; percentage: number } | null;
  lowestScore: { test: string; percentage: number } | null;
  subjectWise: Array<{ subject: string; average: number; tests: number }>;
  trend: Array<{ test: string; date: string; percentage: number }>;
}

// ─── Teacher-side Types ───────────────────────────────────────────────────────

export type TestGradingStatus = "DRAFT" | "GRADING_PENDING" | "GRADED";

export interface TeacherTestListItem {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  testType: TestType;
  totalMarks: number;
  passingMarks: number | null;
  date: Date;
  time: string | null;
  duration: number | null;
  status: TestStatus;
  scoresLocked: boolean;
  publishedAt: string | null;
  batch: { id: number; name: string };
  gradingStatus: TestGradingStatus;
  gradedCount: number;
  totalStudents: number;
  daysUntil: number | null;
}

export interface ScoreSheetEntry {
  studentId: number;
  fullname: string;
  marksObtained: number | null; // null = ungraded
  percentage: number | null;
  grade: string | null;
  status: ScoreStatus | null;
  remarks: string | null;
  scoreId: number | null;
}

export interface BulkSaveScoreInput {
  studentId: number;
  marksObtained: number;
  remarks?: string;
}

export interface TestSummary {
  testId: number;
  title: string;
  subject: string;
  totalMarks: number;
  totalStudents: number;
  gradedCount: number;
  ungradedCount: number;
  classAverage: number;
  highestScore: { studentName: string; marks: number; percentage: number } | null;
  lowestScore: { studentName: string; marks: number; percentage: number } | null;
  distribution: Array<{ range: string; count: number }>;
}

export interface GetTeacherTestsQuery {
  batchId?: number;
  subject?: string;
  status?: TestStatus;
  page?: number;
  limit?: number;
}
