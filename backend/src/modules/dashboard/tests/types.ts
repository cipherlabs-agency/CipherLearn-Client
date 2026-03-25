import { TestType, TestStatus, ScoreStatus } from "../../../../prisma/generated/prisma/enums";

export interface CreateTestInput {
  title: string;
  subject: string;
  description?: string;
  testType?: TestType;
  batchId: number;
  totalMarks: number;
  passingMarks?: number;
  date: string;
  time?: string;
  duration?: number;
  hall?: string;
  syllabus?: string;
  instructions?: string;
}

export interface UpdateTestInput {
  title?: string;
  subject?: string;
  description?: string;
  testType?: TestType;
  batchId?: number;
  totalMarks?: number;
  passingMarks?: number;
  date?: string;
  time?: string;
  duration?: number;
  hall?: string;
  syllabus?: string;
  instructions?: string;
  status?: TestStatus;
}

export interface UploadScoreInput {
  studentId: number;
  marksObtained: number;
  remarks?: string;
}

export interface TestResponse {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  testType: TestType;
  batchId: number;
  batch: { id: number; name: string };
  totalMarks: number;
  passingMarks: number | null;
  date: Date;
  time: string | null;
  duration: number | null;
  hall: string | null;
  syllabus: string | null;
  instructions: string | null;
  status: TestStatus;
  createdBy: number;
  createdAt: Date;
  _count?: { scores: number };
}

export interface TestWithScoresResponse extends TestResponse {
  scores: ScoreResponse[];
}

export interface ScoreResponse {
  id: number;
  testId: number;
  studentId: number;
  student: { id: number; firstname: string; lastname: string; fullname: string };
  marksObtained: number;
  percentage: number;
  grade: string | null;
  status: ScoreStatus;
  remarks: string | null;
  uploadedBy: number;
  createdAt: Date;
}

export interface GetTestsQuery {
  batchId?: number;
  subject?: string;
  status?: TestStatus;
  testType?: TestType;
  page?: number;
  limit?: number;
}

export interface GetScoresQuery {
  page?: number;
  limit?: number;
}

export interface TestStatsResponse {
  testId: number;
  title: string;
  totalStudents: number;
  appeared: number;
  absent: number;
  passed: number;
  failed: number;
  passPercentage: number;
  average: number;
  median: number;
  highest: number;
  lowest: number;
  gradeDistribution: Record<string, number>;
  topScorers: Array<{
    studentId: number;
    fullname: string;
    marks: number;
    percentage: number;
  }>;
}

export interface BulkScoreResult {
  total: number;
  uploaded: number;
  absent: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}
