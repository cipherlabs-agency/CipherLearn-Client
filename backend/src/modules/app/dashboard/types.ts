import type { StudentProfile } from "../profile/types";
import type { AttendancePerformance } from "../attendance/types";
import type { UpcomingAssignment } from "../assignments/types";
import type { AppAnnouncementListItem } from "../announcements/types";
import type { AppFeesSummary } from "../fees/types";

export interface TodayLecture {
  batchName: string;
  time: string;
  startTime?: string;
  endTime?: string;
  isToday: boolean;
  dayOfWeek: string;
}

export interface QuickAccessCounts {
  videos: number;
  notes: number;
  assignments: number;
  studyMaterials: number;
  pendingAssignments: number;
}

export interface DashboardData {
  profile: StudentProfile;
  todayLectures: TodayLecture[];
  attendance: AttendancePerformance;
  upcomingAssignments: UpcomingAssignment[];
  announcements: AppAnnouncementListItem[];
  quickAccess: QuickAccessCounts;
  feesSummary: AppFeesSummary;
}
