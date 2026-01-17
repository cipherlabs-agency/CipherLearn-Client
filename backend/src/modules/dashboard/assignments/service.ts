import { prisma } from "../../../config/db.config";
import { SubmissionStatus } from "../../../../prisma/generated/prisma/enums";
import {
  CreateAssignmentSlotInput,
  UpdateAssignmentSlotInput,
  GetAssignmentSlotsQuery,
  CreateSubmissionInput,
  ReviewSubmissionInput,
  GetSubmissionsQuery,
  SubmissionFile,
} from "./types";

export class AssignmentService {
  // ==================== ASSIGNMENT SLOTS ====================

  async createSlot(data: CreateAssignmentSlotInput) {
    const slot = await prisma.assignmentSlot.create({
      data: {
        title: data.title,
        subject: data.subject,
        description: data.description,
        batchId: data.batchId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdBy: data.createdBy,
      },
      include: {
        batch: { select: { id: true, name: true } },
      },
    });
    return slot;
  }

  async getSlots(query: GetAssignmentSlotsQuery) {
    const { batchId, page = 1, limit = 10, includeExpired = true } = query;
    const skip = (page - 1) * limit;

    const where: {
      isDeleted: boolean;
      batchId?: number;
      dueDate?: { gte: Date };
    } = {
      isDeleted: false,
    };

    if (batchId) {
      where.batchId = batchId;
    }

    if (!includeExpired) {
      where.dueDate = { gte: new Date() };
    }

    const [slots, total] = await Promise.all([
      prisma.assignmentSlot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          batch: { select: { id: true, name: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.assignmentSlot.count({ where }),
    ]);

    return {
      slots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSlotById(id: number) {
    const slot = await prisma.assignmentSlot.findFirst({
      where: { id, isDeleted: false },
      include: {
        batch: { select: { id: true, name: true } },
        submissions: {
          include: {
            student: {
              select: { id: true, fullname: true, email: true },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });
    return slot;
  }

  async updateSlot(id: number, data: UpdateAssignmentSlotInput) {
    const slot = await prisma.assignmentSlot.update({
      where: { id },
      data: {
        title: data.title,
        subject: data.subject,
        description: data.description,
        batchId: data.batchId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        batch: { select: { id: true, name: true } },
      },
    });
    return slot;
  }

  async deleteSlot(id: number) {
    await prisma.assignmentSlot.update({
      where: { id },
      data: { isDeleted: true },
    });
    return { success: true };
  }

  // ==================== STUDENT SUBMISSIONS ====================

  async createSubmission(data: CreateSubmissionInput) {
    // Check if student already submitted to this slot
    const existing = await prisma.studentSubmission.findUnique({
      where: {
        slotId_studentId: {
          slotId: data.slotId,
          studentId: data.studentId,
        },
      },
    });

    if (existing) {
      // If rejected, allow re-upload
      if (existing.status === SubmissionStatus.REJECTED) {
        const updated = await prisma.studentSubmission.update({
          where: { id: existing.id },
          data: {
            files: data.files,
            status: SubmissionStatus.PENDING,
            feedback: null,
            reviewedBy: null,
            reviewedAt: null,
            submittedAt: new Date(),
          },
          include: {
            slot: { select: { id: true, title: true, subject: true } },
            student: { select: { id: true, fullname: true, email: true } },
          },
        });
        return updated;
      }
      throw new Error("You have already submitted to this assignment");
    }

    const submission = await prisma.studentSubmission.create({
      data: {
        slotId: data.slotId,
        studentId: data.studentId,
        files: data.files,
        status: SubmissionStatus.PENDING,
      },
      include: {
        slot: { select: { id: true, title: true, subject: true } },
        student: { select: { id: true, fullname: true, email: true } },
      },
    });
    return submission;
  }

  async getSubmissions(query: GetSubmissionsQuery) {
    const { slotId, studentId, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: {
      slotId?: number;
      studentId?: number;
      status?: SubmissionStatus;
    } = {};

    if (slotId) where.slotId = slotId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status as SubmissionStatus;

    const [submissions, total] = await Promise.all([
      prisma.studentSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: "desc" },
        include: {
          slot: {
            select: { id: true, title: true, subject: true, dueDate: true },
          },
          student: { select: { id: true, fullname: true, email: true } },
        },
      }),
      prisma.studentSubmission.count({ where }),
    ]);

    return {
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSubmissionById(id: number) {
    const submission = await prisma.studentSubmission.findUnique({
      where: { id },
      include: {
        slot: {
          select: {
            id: true,
            title: true,
            subject: true,
            description: true,
            dueDate: true,
            batch: { select: { id: true, name: true } },
          },
        },
        student: { select: { id: true, fullname: true, email: true } },
      },
    });
    return submission;
  }

  async getStudentSubmissionForSlot(slotId: number, studentId: number) {
    const submission = await prisma.studentSubmission.findUnique({
      where: {
        slotId_studentId: { slotId, studentId },
      },
      include: {
        slot: { select: { id: true, title: true, subject: true, dueDate: true } },
      },
    });
    return submission;
  }

  async reviewSubmission(id: number, data: ReviewSubmissionInput) {
    const submission = await prisma.studentSubmission.update({
      where: { id },
      data: {
        status: data.status as SubmissionStatus,
        feedback: data.feedback,
        reviewedBy: data.reviewedBy,
        reviewedAt: new Date(),
      },
      include: {
        slot: { select: { id: true, title: true, subject: true } },
        student: { select: { id: true, fullname: true, email: true } },
      },
    });
    return submission;
  }

  async getStudentAssignmentStats(studentId: number) {
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

  async getSlotSubmissionStats(slotId: number) {
    const [total, pending, accepted, rejected] = await Promise.all([
      prisma.studentSubmission.count({ where: { slotId } }),
      prisma.studentSubmission.count({
        where: { slotId, status: SubmissionStatus.PENDING },
      }),
      prisma.studentSubmission.count({
        where: { slotId, status: SubmissionStatus.ACCEPTED },
      }),
      prisma.studentSubmission.count({
        where: { slotId, status: SubmissionStatus.REJECTED },
      }),
    ]);

    return { total, pending, accepted, rejected };
  }
}

export const assignmentService = new AssignmentService();
