import type { StudentProfile } from "../profile/types";
import type { AttendancePerformance } from "../attendance/types";
import type { UpcomingAssignment } from "../assignments/types";
import type { AppAnnouncementListItem } from "../announcements/types";
import type { AppFeesSummary } from "../fees/types";
import type { AppLectureResponse, DailyScheduleResponse } from "../lectures/types";

export interface QuickAccessCounts {
  videos: number;
  notes: number;
  assignments: number;
  studyMaterials: number;
  pendingAssignments: number;
}

export interface DashboardData {
  profile: StudentProfile;
  todayLectures: AppLectureResponse[];
  nextClass: DailyScheduleResponse["nextClass"];
  attendance: AttendancePerformance;
  upcomingAssignments: UpcomingAssignment[];
  announcements: AppAnnouncementListItem[];
  quickAccess: QuickAccessCounts;
  feesSummary: AppFeesSummary;
  unreadNotificationCount: number;
}

export interface TeacherQuickAccessCounts {
  assignedBatches: number;
  assignmentsCreated: number;
  pendingSubmissions: number;
  testsCreated: number;
  unpublishedResults: number;
  studyMaterials: number;
}

export interface TeacherDashboardData {
  profile: import("../profile/types").TeacherProfileResponse;
  todayLectures: AppLectureResponse[];
  nextClass: DailyScheduleResponse["nextClass"];
  announcements: AppAnnouncementListItem[];
  quickAccess: TeacherQuickAccessCounts;
  unreadNotificationCount: number;
}
