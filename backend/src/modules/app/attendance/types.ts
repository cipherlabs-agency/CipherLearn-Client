import { AttendanceStatus, AttendanceMethod } from "../../../../prisma/generated/prisma/client";

export interface MonthlyAttendance {
  month: string;
  year: number;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

export interface RecentAttendance {
  date: string;
  status: AttendanceStatus;
  markedBy?: string;
  method: AttendanceMethod;
}

export interface AttendancePerformance {
  totalClasses: number;
  present: number;
  absent: number;
  attendancePercentage: number;
  monthlyBreakdown: MonthlyAttendance[];
  recentAttendance: RecentAttendance[];
}

export interface QRAttendanceResult {
  success: boolean;
  message: string;
}
