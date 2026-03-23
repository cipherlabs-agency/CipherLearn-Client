import { prisma } from "../../../config/db.config";
import type {
  QuickAccessCounts,
  DashboardData,
  TeacherQuickAccessCounts,
  TeacherDashboardData,
} from "./types";
import { profileService } from "../profile/service";
import { attendanceService } from "../attendance/service";
import { assignmentsService } from "../assignments/service";
import { announcementsService } from "../announcements/service";
import { feesService } from "../fees/service";
import AppLectureService from "../lectures/service";
import { TestStatus, SubmissionStatus } from "../../../../prisma/generated/prisma/enums";

const lectureService = new AppLectureService();

class DashboardService {
  /**
   * Get today's lectures for a student from the Lecture table
   */
  async getTodayLectures(batchId: number | null) {
    if (!batchId) return { lectures: [], nextClass: null };
    const schedule = await lectureService.getStudentSchedule(batchId);
    return { lectures: schedule.lectures, nextClass: schedule.nextClass };
  }

  /**
   * Get quick access counts
   */
  async getQuickAccessCounts(
    studentId: number,
    batchId: number | null
  ): Promise<QuickAccessCounts> {
    if (!batchId) {
      return {
        videos: 0,
        notes: 0,
        assignments: 0,
        studyMaterials: 0,
        pendingAssignments: 0,
      };
    }

    const [videos, notes, assignments, studyMaterials] = await Promise.all([
      prisma.youtubeVideo.count({
        where: { batchId, isDeleted: false, visibility: { not: "PRIVATE" } },
      }),
      prisma.note.count({
        where: { batchId, isDeleted: false },
      }),
      prisma.assignmentSlot.count({
        where: { batchId, isDeleted: false },
      }),
      prisma.studyMaterial.count({
        where: { batchId, isDeleted: false },
      }),
    ]);

    // Get pending assignments (not submitted by this student)
    const submittedSlotIds = await prisma.studentSubmission.findMany({
      where: { studentId },
      select: { slotId: true },
    });

    const submittedIds = submittedSlotIds.map((s) => s.slotId);

    const pendingAssignments = await prisma.assignmentSlot.count({
      where: {
        batchId,
        isDeleted: false,
        id: { notIn: submittedIds },
      },
    });

    return {
      videos,
      notes,
      assignments,
      studyMaterials,
      pendingAssignments,
    };
  }

  /**
   * Get full dashboard data in one call
   */
  async getDashboard(studentId: number, batchId: number | null, userId?: number): Promise<DashboardData> {
    const [
      profile,
      todaySchedule,
      attendance,
      upcomingAssignments,
      announcementsResult,
      quickAccess,
      feesSummary,
      unreadNotificationCount,
    ] = await Promise.all([
      profileService.getProfile(studentId),
      this.getTodayLectures(batchId),
      attendanceService.getAttendancePerformance(studentId, batchId),
      assignmentsService.getStudentAssignments(studentId, batchId),
      announcementsService.getAnnouncements({ limit: 5 }),
      this.getQuickAccessCounts(studentId, batchId),
      feesService.getFeesSummary(studentId),
      userId ? (prisma as any).notification.count({ where: { userId, isRead: false } }) : Promise.resolve(0),
    ]);

    return {
      profile,
      todayLectures: todaySchedule.lectures,
      nextClass: todaySchedule.nextClass,
      attendance,
      upcomingAssignments,
      announcements: announcementsResult.announcements,
      quickAccess,
      feesSummary,
      unreadNotificationCount,
    };
  }

  async getTeacherQuickAccessCounts(teacherId: number): Promise<TeacherQuickAccessCounts> {
    const [
      taughtBatches,
      assignmentsCreated,
      pendingSubmissions,
      testsCreated,
      unpublishedResults,
      studyMaterials,
    ] = await Promise.all([
      prisma.lecture.findMany({
        where: { teacherId, isDeleted: false },
        select: { batchId: true },
        distinct: ["batchId"],
      }),
      prisma.assignmentSlot.count({
        where: { teacherId, isDeleted: false },
      }),
      prisma.studentSubmission.count({
        where: {
          status: SubmissionStatus.PENDING,
          slot: {
            teacherId,
            isDeleted: false,
          },
        },
      }),
      prisma.test.count({
        where: { teacherId, isDeleted: false },
      }),
      prisma.test.count({
        where: {
          teacherId,
          isDeleted: false,
          status: { in: [TestStatus.COMPLETED, TestStatus.ONGOING] },
        },
      }),
      prisma.studyMaterial.count({
        where: { teacherId, isDeleted: false },
      }),
    ]);

    return {
      assignedBatches: taughtBatches.length,
      assignmentsCreated,
      pendingSubmissions,
      testsCreated,
      unpublishedResults,
      studyMaterials,
    };
  }

  async getTeacherDashboard(teacherId: number): Promise<TeacherDashboardData> {
    const [profile, todaySchedule, announcementsResult, quickAccess, unreadNotificationCount] = await Promise.all([
      profileService.getTeacherProfile(teacherId),
      lectureService.getTeacherSchedule(teacherId),
      announcementsService.getAnnouncements({ limit: 5 }),
      this.getTeacherQuickAccessCounts(teacherId),
      (prisma as any).notification.count({ where: { userId: teacherId, isRead: false } }),
    ]);

    return {
      profile,
      todayLectures: todaySchedule.lectures,
      nextClass: todaySchedule.nextClass,
      announcements: announcementsResult.announcements,
      quickAccess,
      unreadNotificationCount,
    };
  }
}

export const dashboardService = new DashboardService();
