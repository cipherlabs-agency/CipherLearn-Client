import { prisma } from "../../../config/db.config";
import { SubmissionStatus } from "../../../../prisma/generated/prisma/enums";
import type {
  UpcomingAssignment,
  AssignmentDetails,
  StudentSubmissionDetails,
  SubmissionFile,
  CreateSubmissionInput,
  ReviewSubmissionInput,
  AssignmentSlotWithStats,
  SubmissionWithStudent,
  GetAssignmentsQuery,
  GetSubmissionsQuery,
} from "./types";

class AssignmentsService {
  // ==================== STUDENT METHODS ====================

  /**
   * Get assignments for a student (with submission status)
   * status: "pending" = not submitted or overdue (Pending tab)
   *         "completed" = submitted (Completed tab)
   */
  async getStudentAssignments(
    studentId: number,
    batchId: number | null,
    statusFilter?: "pending" | "completed"
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
    });

    const mapped: UpcomingAssignment[] = assignments.map((a) => {
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
        attachments: (a.attachments as string[]) || [],
        dueDate: a.dueDate?.toISOString() || null,
        isOverdue,
        daysRemaining,
        hasSubmitted: !!submission,
        submissionStatus: submission?.status || null,
        submission: submission
          ? {
              id: submission.id,
              files: (submission.files as unknown as SubmissionFile[]) || [],
              note: submission.note ?? null,
              status: submission.status,
              feedback: submission.feedback,
              submittedAt: submission.submittedAt.toISOString(),
              reviewedAt: submission.reviewedAt?.toISOString() || null,
              reviewedBy: submission.reviewedBy,
            }
          : null,
      };
    });

    // Apply status tab filter
    if (statusFilter === "completed") {
      return mapped.filter((a) => a.hasSubmitted);
    }
    if (statusFilter === "pending") {
      return mapped.filter((a) => !a.hasSubmitted);
    }

    return mapped;
  }

  /**
   * Get single assignment details for student
   */
  async getAssignmentById(
    slotId: number,
    studentId: number
  ): Promise<AssignmentDetails | null> {
    const now = new Date();

    const assignment = await prisma.assignmentSlot.findFirst({
      where: {
        id: slotId,
        isDeleted: false,
      },
      include: {
        batch: { select: { id: true, name: true } },
        submissions: {
          where: { studentId },
        },
      },
    });

    if (!assignment) return null;

    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
    const isOverdue = dueDate ? dueDate < now : false;
    const daysRemaining = dueDate
      ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const submission = assignment.submissions[0];

    return {
      id: assignment.id,
      title: assignment.title,
      subject: assignment.subject,
      description: assignment.description,
      attachments: (assignment.attachments as string[]) || [],
      dueDate: assignment.dueDate?.toISOString() || null,
      isOverdue,
      daysRemaining,
      hasSubmitted: !!submission,
      submissionStatus: submission?.status || null,
      batch: assignment.batch,
      createdAt: assignment.createdAt.toISOString(),
      createdBy: assignment.createdBy,
      submission: submission
        ? {
            id: submission.id,
            files: (submission.files as unknown as SubmissionFile[]) || [],
            note: submission.note ?? null,
            status: submission.status,
            feedback: submission.feedback,
            submittedAt: submission.submittedAt.toISOString(),
            reviewedAt: submission.reviewedAt?.toISOString() || null,
            reviewedBy: submission.reviewedBy,
          }
        : null,
    };
  }

  /**
   * Submit assignment (student)
   * Allows re-submission if previous was REJECTED.
   */
  async submitAssignment(
    studentId: number,
    data: CreateSubmissionInput
  ): Promise<StudentSubmissionDetails> {
    const existing = await prisma.studentSubmission.findUnique({
      where: { slotId_studentId: { slotId: data.slotId, studentId } },
    });

    if (existing) {
      if (existing.status !== SubmissionStatus.REJECTED) {
        throw new Error("You have already submitted this assignment");
      }
      // Re-submit after rejection
      const updated = await prisma.studentSubmission.update({
        where: { id: existing.id },
        data: {
          files: data.files as unknown as object[],
          note: data.note ?? null,
          status: SubmissionStatus.PENDING,
          feedback: null,
          reviewedBy: null,
          reviewedAt: null,
          submittedAt: new Date(),
        },
      });

      return {
        id: updated.id,
        files: data.files,
        note: data.note ?? null,
        status: updated.status,
        feedback: null,
        submittedAt: updated.submittedAt.toISOString(),
        reviewedAt: null,
        reviewedBy: null,
      };
    }

    const submission = await prisma.studentSubmission.create({
      data: {
        slotId: data.slotId,
        studentId,
        files: data.files as unknown as object[],
        note: data.note ?? null,
        status: SubmissionStatus.PENDING,
      },
    });

    return {
      id: submission.id,
      files: data.files,
      note: data.note ?? null,
      status: submission.status,
      feedback: null,
      submittedAt: submission.submittedAt.toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    };
  }

  /**
   * Get student's submission for a slot
   */
  async getStudentSubmission(
    slotId: number,
    studentId: number
  ): Promise<StudentSubmissionDetails | null> {
    const submission = await prisma.studentSubmission.findUnique({
      where: {
        slotId_studentId: { slotId, studentId },
      },
    });

    if (!submission) return null;

    return {
      id: submission.id,
      files: (submission.files as unknown as SubmissionFile[]) || [],
      note: submission.note ?? null,
      status: submission.status,
      feedback: submission.feedback,
      submittedAt: submission.submittedAt.toISOString(),
      reviewedAt: submission.reviewedAt?.toISOString() || null,
      reviewedBy: submission.reviewedBy,
    };
  }

  // ==================== TEACHER/ADMIN METHODS ====================

  /**
   * Get all assignments with stats (for teachers/admins)
   */
  async getAssignmentsWithStats(
    query: GetAssignmentsQuery
  ): Promise<{ slots: AssignmentSlotWithStats[]; pagination: object }> {
    const { batchId, page = 1, limit = 20, includeExpired = true } = query;
    const skip = (page - 1) * limit;

    const where: {
      isDeleted: boolean;
      batchId?: number;
      dueDate?: { gte: Date };
    } = {
      isDeleted: false,
    };

    if (batchId) where.batchId = batchId;
    if (!includeExpired) where.dueDate = { gte: new Date() };

    const [slots, total] = await Promise.all([
      prisma.assignmentSlot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          batch: { select: { id: true, name: true } },
          _count: { select: { submissions: true } },
          submissions: {
            select: { status: true },
          },
        },
      }),
      prisma.assignmentSlot.count({ where }),
    ]);

    const slotsWithStats: AssignmentSlotWithStats[] = slots.map((slot) => {
      const pending = slot.submissions.filter(
        (s) => s.status === SubmissionStatus.PENDING
      ).length;
      const accepted = slot.submissions.filter(
        (s) => s.status === SubmissionStatus.ACCEPTED
      ).length;
      const rejected = slot.submissions.filter(
        (s) => s.status === SubmissionStatus.REJECTED
      ).length;

      return {
        id: slot.id,
        title: slot.title,
        subject: slot.subject,
        description: slot.description,
        attachments: (slot.attachments as string[]) || [],
        dueDate: slot.dueDate?.toISOString() || null,
        createdAt: slot.createdAt.toISOString(),
        createdBy: slot.createdBy,
        batch: slot.batch,
        stats: {
          total: slot._count.submissions,
          pending,
          accepted,
          rejected,
        },
      };
    });

    return {
      slots: slotsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get submissions for a slot (teacher/admin view)
   */
  async getSlotSubmissions(
    slotId: number,
    query: GetSubmissionsQuery
  ): Promise<{ submissions: SubmissionWithStudent[]; pagination: object }> {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: {
      slotId: number;
      status?: SubmissionStatus;
    } = { slotId };

    if (status) where.status = status;

    const [submissions, total] = await Promise.all([
      prisma.studentSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: "desc" },
        include: {
          student: { select: { id: true, fullname: true, email: true } },
          slot: { select: { id: true, title: true, subject: true } },
        },
      }),
      prisma.studentSubmission.count({ where }),
    ]);

    const mapped: SubmissionWithStudent[] = submissions.map((sub) => ({
      id: sub.id,
      files: (sub.files as unknown as SubmissionFile[]) || [],
      note: sub.note ?? null,
      status: sub.status,
      feedback: sub.feedback,
      submittedAt: sub.submittedAt.toISOString(),
      reviewedAt: sub.reviewedAt?.toISOString() || null,
      reviewedBy: sub.reviewedBy,
      student: sub.student,
      slot: sub.slot,
    }));

    return {
      submissions: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single submission details
   */
  async getSubmissionById(
    submissionId: number
  ): Promise<SubmissionWithStudent | null> {
    const submission = await prisma.studentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: { select: { id: true, fullname: true, email: true } },
        slot: { select: { id: true, title: true, subject: true } },
      },
    });

    if (!submission) return null;

    return {
      id: submission.id,
      files: (submission.files as unknown as SubmissionFile[]) || [],
      note: submission.note ?? null,
      status: submission.status,
      feedback: submission.feedback,
      submittedAt: submission.submittedAt.toISOString(),
      reviewedAt: submission.reviewedAt?.toISOString() || null,
      reviewedBy: submission.reviewedBy,
      student: submission.student,
      slot: submission.slot,
    };
  }

  /**
   * Review submission (teacher/admin)
   */
  async reviewSubmission(
    submissionId: number,
    reviewerName: string,
    data: ReviewSubmissionInput
  ): Promise<SubmissionWithStudent> {
    const submission = await prisma.studentSubmission.update({
      where: { id: submissionId },
      data: {
        status: data.status as SubmissionStatus,
        feedback: data.feedback || null,
        reviewedBy: reviewerName,
        reviewedAt: new Date(),
      },
      include: {
        student: { select: { id: true, fullname: true, email: true } },
        slot: { select: { id: true, title: true, subject: true } },
      },
    });

    return {
      id: submission.id,
      files: (submission.files as unknown as SubmissionFile[]) || [],
      note: submission.note ?? null,
      status: submission.status,
      feedback: submission.feedback,
      submittedAt: submission.submittedAt.toISOString(),
      reviewedAt: submission.reviewedAt?.toISOString() || null,
      reviewedBy: submission.reviewedBy,
      student: submission.student,
      slot: submission.slot,
    };
  }

  // ==================== STATS METHODS ====================

  /**
   * Get assignment stats for a student
   */
  async getStudentStats(studentId: number) {
    const [total, pending, accepted, rejected] = await Promise.all([
      prisma.studentSubmission.count({ where: { studentId } }),
      prisma.studentSubmission.count({
        where: { studentId, status: SubmissionStatus.PENDING },
      }),
      prisma.studentSubmission.count({
        where: { studentId, status: SubmissionStatus.ACCEPTED },
      }),
      prisma.studentSubmission.count({
        where: { studentId, status: SubmissionStatus.REJECTED },
      }),
    ]);

    return { total, pending, accepted, rejected };
  }
}

export const assignmentsService = new AssignmentsService();
