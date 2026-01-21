import { prisma } from "../../../config/db.config";
import type { TodayLecture, QuickAccessCounts, DashboardData } from "./types";
import type { BatchTimings } from "../types";
import { profileService } from "../profile/service";
import { attendanceService } from "../attendance/service";
import { assignmentsService } from "../assignments/service";
import { announcementsService } from "../announcements/service";
import { feesService } from "../fees/service";

class DashboardService {
  /**
   * Get today's lectures based on batch timings
   */
  async getTodayLectures(batchId: number | null): Promise<TodayLecture[]> {
    if (!batchId) return [];

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        name: true,
        timings: true,
      },
    });

    if (!batch || !batch.timings) return [];

    const timings = batch.timings as BatchTimings;
    const today = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayDay = daysOfWeek[today.getDay()];

    const scheduledDays = timings.days || [];
    const isToday = scheduledDays.some(
      (day) => day.toLowerCase() === todayDay.toLowerCase()
    );

    return [
      {
        batchName: batch.name,
        time: timings.time || "",
        startTime: timings.startTime,
        endTime: timings.endTime,
        isToday,
        dayOfWeek: todayDay,
      },
    ];
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
  async getDashboard(studentId: number, batchId: number | null): Promise<DashboardData> {
    const [
      profile,
      todayLectures,
      attendance,
      upcomingAssignments,
      announcements,
      quickAccess,
      feesSummary,
    ] = await Promise.all([
      profileService.getProfile(studentId),
      this.getTodayLectures(batchId),
      attendanceService.getAttendancePerformance(studentId, batchId),
      assignmentsService.getUpcomingAssignments(studentId, batchId),
      announcementsService.getAnnouncements(5),
      this.getQuickAccessCounts(studentId, batchId),
      feesService.getFeesSummary(studentId),
    ]);

    return {
      profile,
      todayLectures,
      attendance,
      upcomingAssignments,
      announcements,
      quickAccess,
      feesSummary,
    };
  }
}

export const dashboardService = new DashboardService();
