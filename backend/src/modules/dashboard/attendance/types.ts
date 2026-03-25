import {
  AttendanceMethod,
  AttendanceStatus,
} from "../../../../prisma/generated/prisma/enums";

export type AttendanceSheet = {
  batchId: number;
  date: Date;
  attendanceRecords: Attendance[];
};

export type Attendance = {
  studentId: number;
  batchId: number;
  date: Date;
  time: Date;
  markedBy: string;
  method: AttendanceMethod;
  status: AttendanceStatus;
  attendanceSheetId?: number;
};

export type DayAttendanceResponse = {
  day: number;
  date: string;
  attendance: {
    id: number;
    status: string;
    method: string;
    markedBy?: string | null;
    time?: string | null;
    studentId: number;
  } | null;
};

export type AttendanceMatrixOptions = {
  month?: number | string;
  year?: number | string;
};

/**
 * Bulk attendance input for marking multiple students at once
 */
export interface MarkBulkAttendanceInput {
  batchId: number;
  date: string;
  markedBy: string;
  markedById: number;
  attendances: {
    studentId: number;
    status: AttendanceStatus;
  }[];
}

/**
 * Query parameters for attendance report
 */
export interface AttendanceReportQuery {
  batchId: number;
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}

/**
 * Attendance report response
 */
export interface AttendanceReport {
  batchId: number;
  batchName: string;
  startDate: string;
  endDate: string;
  totalStudents: number;
  overallAttendancePercentage: number;
  studentStats: StudentAttendanceStats[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface StudentAttendanceStats {
  studentId: number;
  studentName: string;
  email: string;
  presentDays: number;
  absentDays: number;
  totalDays: number;
  percentage: number;
}

/**
 * QR Attendance input
 */
export interface QRAttendanceInput {
  studentId: number;
  qrData: string;
}
