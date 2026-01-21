import { prisma } from "../../../config/db.config";
import type { UpcomingAssignment } from "./types";

class AssignmentsService {
  /**
   * Get upcoming assignments for a student
   */
  async getUpcomingAssignments(
    studentId: number,
    batchId: number | null
  ): Promise<UpcomingAssignment[]> {
    if (!batchId) return [];

    const now = new Date();

    const assignments = await prisma.assignmentSlot.findMany({
      where: {
        batchId,
        isDeleted: false,
      },
      include: {
        submissions: {
          where: { studentId },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    return assignments.map((a) => {
      const dueDate = a.dueDate ? new Date(a.dueDate) : null;
      const isOverdue = dueDate ? dueDate < now : false;
      const daysRemaining = dueDate
        ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const submission = a.submissions[0];

      return {
        id: a.id,
        title: a.title,
        subject: a.subject,
        description: a.description,
        dueDate: a.dueDate?.toISOString() || null,
        isOverdue,
        daysRemaining,
        hasSubmitted: !!submission,
        submissionStatus: submission?.status || null,
      };
    });
  }
}

export const assignmentsService = new AssignmentsService();
