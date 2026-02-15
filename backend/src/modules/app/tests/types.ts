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
