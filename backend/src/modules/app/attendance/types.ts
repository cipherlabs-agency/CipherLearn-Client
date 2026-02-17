import { AttendanceStatus, AttendanceMethod } from "../../../../prisma/generated/prisma/client";

export interface MonthlyAttendance {
  month: string;
  year: number;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export interface RecentAttendance {
  date: string;
  status: AttendanceStatus;
  markedBy?: string;
  method: AttendanceMethod;
  subject?: string;
  reason?: string;
  time?: string;
}

export interface AttendancePerformance {
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  attendancePercentage: number;
  statusLabel: string;
  monthlyBreakdown: MonthlyAttendance[];
  recentAttendance: RecentAttendance[];
}

export interface QRAttendanceResult {
  success: boolean;
  message: string;
}

export interface AttendanceCalendarDay {
  date: string;
  status: AttendanceStatus;
  subject?: string;
}

export interface AttendanceHistoryQuery {
  month?: number;
  year?: number;
  status?: AttendanceStatus;
}
