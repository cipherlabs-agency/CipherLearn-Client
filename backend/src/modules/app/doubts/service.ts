import { prisma } from "../../../config/db.config";
import { DoubtStatus } from "../../../../prisma/generated/prisma/enums";
import {
  PostDoubtInput,
  ReplyDoubtInput,
  DoubtItem,
  DoubtThread,
  DoubtListResponse,
  DoubtReplyItem,
} from "./types";
import { cacheService } from "../../../cache/index";
import { sendToBatchStudents, sendToAllTeachersOfBatch } from "../../../utils/pushNotifications";

function buildCacheKey(studentId: number): string {
  return `app:doubts:student:${studentId}`;
}

function buildTeacherCacheKey(batchId: number): string {
  return `app:doubts:batch:${batchId}`;
}

function mapDoubt(d: any, includeStudent = false): DoubtItem {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    subject: d.subject,
    status: d.status,
    replyCount: d.replies?.length ?? 0,
    lastReplyAt: d.replies?.length
      ? d.replies[d.replies.length - 1].createdAt
      : null,
    createdAt: d.createdAt,
    ...(includeStudent && d.student
      ? {
          student: {
            id: d.student.id,
            fullname: d.student.fullname,
            grade: d.student.grade,
          },
        }
      : {}),
  };
}

function mapReply(r: any): DoubtReplyItem {
  return {
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    user: { id: r.user.id, name: r.user.name, role: r.user.role },
    isTeacher: r.user.role === "TEACHER" || r.user.role === "ADMIN",
  };
}

export class DoubtsService {
  // ─── Student: list my doubts ─────────────────────────────────────────────────

  async getStudentDoubts(
    studentId: number,
    page = 1,
    limit = 20
  ): Promise<DoubtListResponse> {
    const skip = (page - 1) * limit;
    const cacheKey = `${buildCacheKey(studentId)}:p${page}:l${limit}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const [doubts, total] = await Promise.all([
          prisma.doubt.findMany({
            where: { studentId },
            include: {
              replies: {
                orderBy: { createdAt: "asc" },
                select: { createdAt: true },
              },
            },
            orderBy: { updatedAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.doubt.count({ where: { studentId } }),
        ]);

        return { doubts: doubts.map((d) => mapDoubt(d)), total, page, limit };
      },
      120
    );
  }

  // ─── Student: post a doubt ────────────────────────────────────────────────────

  async postDoubt(studentId: number, batchId: number, data: PostDoubtInput): Promise<DoubtItem> {
    const doubt = await prisma.doubt.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        subject: data.subject?.trim() ?? null,
        studentId,
        batchId,
        status: DoubtStatus.OPEN,
      },
      include: { replies: { select: { createdAt: true } } },
    });

    // Invalidate student + batch caches
    await cacheService.delByPrefix(buildCacheKey(studentId));
    await cacheService.delByPrefix(buildTeacherCacheKey(batchId));

    // Notify teacher(s) of the batch about the new doubt (fire-and-forget)
    sendToAllTeachersOfBatch(batchId, "New Doubt Posted", `A student asked: "${data.title}"`, {
      type: "new_doubt",
      doubtId: doubt.id,
    }).catch(() => {});

    return mapDoubt(doubt);
  }

  // ─── Student: view doubt thread ───────────────────────────────────────────────

  async getDoubtThread(doubtId: number, studentId: number): Promise<DoubtThread> {
    const doubt = await prisma.doubt.findFirst({
      where: { id: doubtId, studentId },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!doubt) throw new Error("Doubt not found");

    return {
      ...mapDoubt(doubt),
      replies: doubt.replies.map(mapReply),
    };
  }

  // ─── Teacher: list doubts from their batch ────────────────────────────────────

  async getTeacherDoubts(
    teacherId: number,
    batchId?: number,
    status?: DoubtStatus,
    page = 1,
    limit = 20
  ): Promise<DoubtListResponse> {
    // Teacher can only see doubts from batches they teach
    const assignedBatchIds = await this.getTeacherBatchIds(teacherId);
    if (assignedBatchIds.length === 0) {
      return { doubts: [], total: 0, page, limit };
    }

    const whereClause = {
      batchId: batchId
        ? { in: [batchId].filter((id) => assignedBatchIds.includes(id)) }
        : { in: assignedBatchIds },
      ...(status ? { status } : {}),
    };

    const skip = (page - 1) * limit;

    const [doubts, total] = await Promise.all([
      prisma.doubt.findMany({
        where: whereClause,
        include: {
          student: { select: { id: true, fullname: true, grade: true } },
          replies: { orderBy: { createdAt: "asc" }, select: { createdAt: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.doubt.count({ where: whereClause }),
    ]);

    return {
      doubts: doubts.map((d) => mapDoubt(d, true)),
      total,
      page,
      limit,
    };
  }

  // ─── Teacher: reply to a doubt ────────────────────────────────────────────────

  async replyToDoubt(
    doubtId: number,
    teacherId: number,
    data: ReplyDoubtInput
  ): Promise<DoubtThread> {
    const doubt = await prisma.doubt.findUnique({
      where: { id: doubtId },
      select: { id: true, studentId: true, batchId: true, status: true },
    });

    if (!doubt) throw new Error("Doubt not found");

    // Verify teacher teaches this batch
    const assignedBatchIds = await this.getTeacherBatchIds(teacherId);
    if (!assignedBatchIds.includes(doubt.batchId)) {
      throw new Error("Access denied: this doubt is not from your batch");
    }

    await prisma.$transaction([
      prisma.doubtReply.create({
        data: { doubtId, userId: teacherId, body: data.body.trim() },
      }),
      // Auto-mark as ANSWERED if it was OPEN
      prisma.doubt.update({
        where: { id: doubtId },
        data: {
          status:
            doubt.status === DoubtStatus.OPEN
              ? DoubtStatus.ANSWERED
              : doubt.status,
        },
      }),
    ]);

    // Invalidate caches
    await cacheService.delByPrefix(buildCacheKey(doubt.studentId));
    await cacheService.delByPrefix(buildTeacherCacheKey(doubt.batchId));

    // Notify the student about the teacher's reply (fire-and-forget, respects preferences)
    const student = await prisma.student.findUnique({
      where: { id: doubt.studentId },
      select: { userId: true },
    });
    if (student?.userId) {
      sendToBatchStudents(doubt.batchId, "doubtResponses", "Your doubt was answered", "Your teacher replied to your question.", {
        type: "doubt_reply",
        doubtId,
      }).catch(() => {});
    }

    return this.getDoubtThreadAsTeacher(doubtId);
  }

  // ─── Teacher/Student: resolve a doubt ────────────────────────────────────────

  async resolveDoubt(
    doubtId: number,
    userId: number,
    role: string
  ): Promise<DoubtItem> {
    const doubt = await prisma.doubt.findUnique({
      where: { id: doubtId },
      select: { id: true, studentId: true, batchId: true },
    });
    if (!doubt) throw new Error("Doubt not found");

    // Only the student who posted or a teacher of the batch can resolve
    if (role === "STUDENT" && doubt.studentId !== userId) {
      throw new Error("Access denied");
    }
    if (role === "TEACHER") {
      const assignedBatchIds = await this.getTeacherBatchIds(userId);
      if (!assignedBatchIds.includes(doubt.batchId)) {
        throw new Error("Access denied");
      }
    }

    const updated = await prisma.doubt.update({
      where: { id: doubtId },
      data: { status: DoubtStatus.RESOLVED },
      include: { replies: { select: { createdAt: true } } },
    });

    await cacheService.delByPrefix(buildCacheKey(doubt.studentId));
    await cacheService.delByPrefix(buildTeacherCacheKey(doubt.batchId));

    return mapDoubt(updated);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private async getTeacherBatchIds(teacherId: number): Promise<number[]> {
    const lectures = await prisma.lecture.findMany({
      where: { teacherId, isDeleted: false },
      select: { batchId: true },
      distinct: ["batchId"],
    });
    return lectures.map((l) => l.batchId);
  }

  private async getDoubtThreadAsTeacher(doubtId: number): Promise<DoubtThread> {
    const doubt = await prisma.doubt.findUnique({
      where: { id: doubtId },
      include: {
        student: { select: { id: true, fullname: true, grade: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    });
    if (!doubt) throw new Error("Doubt not found");
    return {
      ...mapDoubt(doubt, true),
      replies: doubt.replies.map(mapReply),
    };
  }
}

export const doubtsService = new DoubtsService();
