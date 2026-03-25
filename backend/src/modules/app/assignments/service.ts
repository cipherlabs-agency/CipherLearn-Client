import crypto from "crypto";
import { prisma } from "../../../config/db.config";
import {
  SubmissionStatus,
  AssignmentStatus,
  SubmissionType,
} from "../../../../prisma/generated/prisma/enums";

/**
 * Normalize submissionType from mobile/frontend to the Prisma enum value.
 * Mobile apps may send "FILE" (old name) instead of the schema value "FILE_UPLOAD".
 */
function normalizeSubmissionType(raw: string | undefined): SubmissionType {
  switch (raw) {
    case "FILE":
    case "FILE_UPLOAD":
      return SubmissionType.FILE_UPLOAD;
    case "TEXT":
    case "TEXT_ENTRY":
      return SubmissionType.TEXT_ENTRY;
    case "BOTH":
      return SubmissionType.BOTH;
    default:
      return SubmissionType.FILE_UPLOAD;
  }
}
import type { Prisma } from "../../../../prisma/generated/prisma/client";
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
  CreateAssignmentInput,
  UpdateAssignmentInput,
  TeacherAssignmentListItem,
  AssignmentReviewPage,
  ReviewPageStudent,
  ReviewStatus,
  GetTeacherAssignmentsQuery,
} from "./types";

/**
 * Normalize the `attachments` / `files` JSON field from the DB.
 * Dashboard stores plain URL strings; App stores SubmissionFile objects.
 * Always returns SubmissionFile[].
 */
function normalizeFiles(raw: unknown): SubmissionFile[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") {
      const filename = item.split("/").pop() ?? "file";
      return { url: item, publicId: "", originalFilename: filename, size: 0, mimeType: "" };
    }
    return item as SubmissionFile;
  });
}

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
        attachments: normalizeFiles(a.attachments),
        dueDate: a.dueDate?.toISOString() || null,
        isOverdue,
        daysRemaining,
        hasSubmitted: !!submission,
        submissionStatus: submission?.status || null,
        submission: submission
          ? {
              id: submission.id,
              files: normalizeFiles(submission.files),
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
      attachments: (assignment.attachments as unknown as SubmissionFile[]) || [],
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
            files: normalizeFiles(submission.files),
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
      files: normalizeFiles(submission.files),
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
        attachments: normalizeFiles(slot.attachments),
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
      files: normalizeFiles(submission.files),
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
      files: normalizeFiles(submission.files),
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

  // ==================== TEACHER CREATE/UPDATE/DELETE ====================

  /**
   * Create an assignment for one or multiple batches.
   * Multi-batch: one AssignmentSlot per batchId, all linked by groupId.
   */
  async createTeacherAssignment(
    teacherId: number,
    teacherName: string,
    input: CreateAssignmentInput,
    attachments: SubmissionFile[]
  ) {
    if (!input.batchIds || input.batchIds.length === 0) {
      throw new Error("At least one batch must be selected");
    }

    const groupId =
      input.batchIds.length > 1 ? crypto.randomUUID() : null;

    const slots = await prisma.$transaction(
      input.batchIds.map((batchId) =>
        prisma.assignmentSlot.create({
          data: {
            title: input.title.trim(),
            subject: input.subject.trim(),
            description: input.description?.trim() ?? null,
            attachments:
              attachments.length > 0
                ? (attachments as unknown as Prisma.InputJsonValue)
                : undefined,
            batchId,
            teacherId,
            groupId,
            submissionType: normalizeSubmissionType(input.submissionType as string | undefined),
            assignmentStatus: input.assignmentStatus ?? "PUBLISHED",
            allowLateSubmissions: input.allowLateSubmissions ?? false,
            plagiarismCheck: input.plagiarismCheck ?? false,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            createdBy: teacherName,
          },
          include: { batch: { select: { id: true, name: true } } },
        })
      )
    );

    return slots;
  }

  /**
   * Update an assignment slot (teacher must own it).
   */
  async updateTeacherAssignment(
    slotId: number,
    teacherId: number,
    input: UpdateAssignmentInput
  ) {
    const slot = await prisma.assignmentSlot.findFirst({
      where: { id: slotId, teacherId, isDeleted: false },
    });

    if (!slot) {
      throw new Error("Assignment not found or access denied");
    }

    const updated = await prisma.assignmentSlot.update({
      where: { id: slotId },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.subject !== undefined && { subject: input.subject.trim() }),
        ...(input.description !== undefined && {
          description: input.description?.trim() ?? null,
        }),
        ...(input.dueDate !== undefined && {
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
        ...(input.submissionType !== undefined && {
          submissionType: normalizeSubmissionType(input.submissionType as string | undefined),
        }),
        ...(input.assignmentStatus !== undefined && {
          assignmentStatus: input.assignmentStatus,
        }),
        ...(input.allowLateSubmissions !== undefined && {
          allowLateSubmissions: input.allowLateSubmissions,
        }),
        ...(input.plagiarismCheck !== undefined && {
          plagiarismCheck: input.plagiarismCheck,
        }),
      },
      include: { batch: { select: { id: true, name: true } } },
    });

    return updated;
  }

  /**
   * Soft-delete an assignment (teacher must own it).
   */
  async deleteTeacherAssignment(
    slotId: number,
    teacherId: number,
    teacherName: string
  ): Promise<void> {
    const slot = await prisma.assignmentSlot.findFirst({
      where: { id: slotId, teacherId, isDeleted: false },
    });

    if (!slot) {
      throw new Error("Assignment not found or access denied");
    }

    await prisma.assignmentSlot.update({
      where: { id: slotId },
      data: { isDeleted: true, deletedBy: teacherName },
    });
  }

  // ==================== TEACHER LIST & REVIEW ====================

  /**
   * Get teacher's assignments with tab filters.
   * Tabs: active | drafts | graded
   */
  async getTeacherAssignments(
    teacherId: number,
    query: GetTeacherAssignmentsQuery
  ): Promise<{
    assignments: TeacherAssignmentListItem[];
    pagination: object;
  }> {
    const { tab = "active", batchId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.AssignmentSlotWhereInput = {
      teacherId,
      isDeleted: false,
    };

    if (batchId) where.batchId = batchId;

    if (tab === "active") {
      where.assignmentStatus = AssignmentStatus.PUBLISHED;
      where.OR = [{ dueDate: null }, { dueDate: { gte: now } }];
    } else if (tab === "drafts") {
      where.assignmentStatus = AssignmentStatus.DRAFT;
    } else if (tab === "graded") {
      where.assignmentStatus = AssignmentStatus.PUBLISHED;
      where.dueDate = { lt: now };
    }

    const [slots, total] = await Promise.all([
      prisma.assignmentSlot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          batch: { select: { id: true, name: true } },
          submissions: {
            select: { id: true, submittedAt: true, status: true },
          },
        },
      }),
      prisma.assignmentSlot.count({ where }),
    ]);

    // Batch-student counts
    const uniqueBatchIds = [...new Set(slots.map((s) => s.batchId))];
    const studentCounts = await prisma.student.groupBy({
      by: ["batchId"],
      where: {
        batchId: { in: uniqueBatchIds as number[] },
        isDeleted: false,
      },
      _count: { id: true },
    });
    const countMap = new Map(
      studentCounts.map((sc) => [sc.batchId, sc._count.id])
    );

    const assignments: TeacherAssignmentListItem[] = slots.map((slot) => {
      const totalStudents = countMap.get(slot.batchId) ?? 0;
      const dueDate = slot.dueDate ? new Date(slot.dueDate) : null;
      const submitted = slot.submissions.length;
      const late = dueDate
        ? slot.submissions.filter((s) => s.submittedAt > dueDate).length
        : 0;
      const missing = Math.max(0, totalStudents - submitted);

      return {
        id: slot.id,
        title: slot.title,
        subject: slot.subject,
        description: slot.description,
        attachments: normalizeFiles(slot.attachments),
        dueDate: slot.dueDate?.toISOString() || null,
        submissionType: slot.submissionType,
        assignmentStatus: slot.assignmentStatus,
        allowLateSubmissions: slot.allowLateSubmissions,
        plagiarismCheck: slot.plagiarismCheck,
        groupId: slot.groupId,
        batch: slot.batch,
        stats: { total: totalStudents, submitted, late, missing },
        createdAt: slot.createdAt.toISOString(),
      };
    });

    return {
      assignments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get per-student review page for a slot.
   * Returns SUBMITTED | LATE | MISSING status per student.
   * statusFilter: "submitted" | "not_submitted" | "late" | undefined (all)
   */
  async getAssignmentReviewPage(
    slotId: number,
    teacherId: number,
    statusFilter?: string
  ): Promise<AssignmentReviewPage | null> {
    const slot = await prisma.assignmentSlot.findFirst({
      where: { id: slotId, teacherId, isDeleted: false },
      include: { batch: { select: { id: true, name: true } } },
    });

    if (!slot) return null;

    const [students, submissions] = await Promise.all([
      prisma.student.findMany({
        where: { batchId: slot.batchId, isDeleted: false },
        select: { id: true, fullname: true },
        orderBy: { fullname: "asc" },
      }),
      prisma.studentSubmission.findMany({
        where: { slotId },
        select: {
          id: true,
          studentId: true,
          submittedAt: true,
          status: true,
          files: true,
          note: true,
          feedback: true,
        },
      }),
    ]);

    const submissionMap = new Map(
      submissions.map((s) => [s.studentId, s])
    );
    const dueDate = slot.dueDate ? new Date(slot.dueDate) : null;

    let reviewStudents: ReviewPageStudent[] = students.map((student) => {
      const sub = submissionMap.get(student.id);
      if (!sub) {
        return {
          studentId: student.id,
          fullname: student.fullname,
          status: "MISSING" as ReviewStatus,
          submittedAt: null,
          submissionId: null,
          submissionStatus: null,
          files: [],
          note: null,
          feedback: null,
        };
      }
      const isLate = dueDate ? sub.submittedAt > dueDate : false;
      return {
        studentId: student.id,
        fullname: student.fullname,
        status: (isLate ? "LATE" : "SUBMITTED") as ReviewStatus,
        submittedAt: sub.submittedAt.toISOString(),
        submissionId: sub.id,
        submissionStatus: sub.status,
        files: normalizeFiles(sub.files),
        note: sub.note ?? null,
        feedback: sub.feedback ?? null,
      };
    });

    // Apply filter
    if (statusFilter === "submitted") {
      reviewStudents = reviewStudents.filter((s) => s.status === "SUBMITTED");
    } else if (statusFilter === "not_submitted") {
      reviewStudents = reviewStudents.filter((s) => s.status === "MISSING");
    } else if (statusFilter === "late") {
      reviewStudents = reviewStudents.filter((s) => s.status === "LATE");
    }

    const submitted = submissions.length;
    const late = dueDate
      ? submissions.filter((s) => s.submittedAt > dueDate).length
      : 0;
    const missing = Math.max(0, students.length - submitted);

    return {
      slot: {
        id: slot.id,
        title: slot.title,
        subject: slot.subject,
        batchName: slot.batch.name,
        dueDate: slot.dueDate?.toISOString() || null,
        allowLateSubmissions: slot.allowLateSubmissions,
      },
      stats: {
        total: students.length,
        submitted,
        late,
        missing,
      },
      students: reviewStudents,
    };
  }

  /**
   * Teacher assignment quick stats: due today + pending submissions to review
   */
  async getTeacherStats(teacherId: number): Promise<{ dueToday: number; toReview: number }> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [dueToday, toReview] = await Promise.all([
      // Assignments with due date falling today
      prisma.assignmentSlot.count({
        where: {
          teacherId,
          isDeleted: false,
          assignmentStatus: AssignmentStatus.PUBLISHED,
          dueDate: { gte: startOfDay, lte: endOfDay },
        },
      }),
      // Pending (unreviewed) submissions across teacher's published assignments
      prisma.studentSubmission.count({
        where: {
          status: "PENDING",
          slot: {
            teacherId,
            isDeleted: false,
            assignmentStatus: AssignmentStatus.PUBLISHED,
          },
        },
      }),
    ]);

    return { dueToday, toReview };
  }
}

export const assignmentsService = new AssignmentsService();
