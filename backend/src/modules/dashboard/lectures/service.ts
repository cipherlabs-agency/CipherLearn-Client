import { prisma } from "../../../config/db.config";
import { UserRoles, LectureStatus } from "../../../../prisma/generated/prisma/enums";
import { sendToBatchStudents, sendToUser } from "../../../utils/pushNotifications";
import {
  CreateLectureInput,
  CreateBulkLecturesInput,
  UpdateLectureInput,
  LectureResponse,
  GetLecturesQuery,
  ScheduleQuery,
} from "./types";
import { randomUUID } from "crypto";

const LECTURE_INCLUDE = {
  batch: { select: { id: true, name: true } },
  teacher: { select: { id: true, name: true } },
} as const;

function calculateDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function getDayName(date: Date): string {
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  return days[date.getDay()];
}

export default class LectureService {
  public async create(data: CreateLectureInput, userId: number): Promise<LectureResponse> {
    // Verify batch exists
    const batch = await prisma.batch.findFirst({
      where: { id: data.batchId, isDeleted: false },
    });
    if (!batch) throw new Error("Batch not found");

    let teacherId = data.teacherId ?? null;
    let assignedBy: string | null = null;

    // Auto-assign teacher if requested
    if (data.autoAssign && !teacherId) {
      teacherId = await this.autoAssignTeacher(data.subject);
      assignedBy = teacherId ? "auto" : null;
    } else if (teacherId) {
      // Verify teacher exists
      const teacher = await prisma.user.findFirst({
        where: { id: teacherId, role: UserRoles.TEACHER },
      });
      if (!teacher) throw new Error("Teacher not found");
      assignedBy = "admin";
    }

    const duration = calculateDuration(data.startTime, data.endTime);
    if (duration <= 0) throw new Error("End time must be after start time");

    const lecture = await prisma.lecture.create({
      data: {
        title: data.title,
        subject: data.subject,
        description: data.description || null,
        room: data.room || null,
        batchId: data.batchId,
        teacherId,
        assignedBy,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        duration,
        createdBy: userId,
      },
      include: LECTURE_INCLUDE,
    });

    // Notify students in the batch about the new lecture (fire-and-forget)
    const dateStr = new Date(data.date).toLocaleDateString("en-IN", { dateStyle: "medium" });
    sendToBatchStudents(
      data.batchId,
      "timetableChanges",
      "New Class Scheduled",
      `${data.subject} on ${dateStr} at ${data.startTime}`,
      { type: "lecture_scheduled", lectureId: lecture.id }
    ).catch(() => {});

    // Notify the assigned teacher
    if (teacherId) {
      sendToUser(
        teacherId,
        "New Class Assigned",
        `You have been assigned to teach ${data.subject} on ${dateStr} at ${data.startTime}`,
        { type: "lecture_assigned", lectureId: lecture.id }
      ).catch(() => {});
    }

    return lecture as LectureResponse;
  }

  public async createBulk(data: CreateBulkLecturesInput, userId: number): Promise<{ created: number; recurrenceId: string }> {
    const batch = await prisma.batch.findFirst({
      where: { id: data.batchId, isDeleted: false },
    });
    if (!batch) throw new Error("Batch not found");

    if (data.teacherId) {
      const teacher = await prisma.user.findFirst({
        where: { id: data.teacherId, role: UserRoles.TEACHER },
      });
      if (!teacher) throw new Error("Teacher not found");
    }

    const duration = calculateDuration(data.startTime, data.endTime);
    if (duration <= 0) throw new Error("End time must be after start time");

    const recurrenceId = randomUUID();
    const startDate = new Date(data.recurrence.startDate);
    const endDate = new Date(data.recurrence.endDate);
    const lectures: Array<{
      title: string;
      subject: string;
      description: string | null;
      room: string | null;
      batchId: number;
      teacherId: number | null;
      assignedBy: string | null;
      date: Date;
      startTime: string;
      endTime: string;
      duration: number;
      recurrenceId: string;
      createdBy: number;
    }> = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      const dayName = getDayName(current);
      if (data.recurrence.days.includes(dayName)) {
        lectures.push({
          title: data.title,
          subject: data.subject,
          description: data.description || null,
          room: data.room || null,
          batchId: data.batchId,
          teacherId: data.teacherId || null,
          assignedBy: data.teacherId ? "admin" : null,
          date: new Date(current),
          startTime: data.startTime,
          endTime: data.endTime,
          duration,
          recurrenceId,
          createdBy: userId,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    if (lectures.length === 0) {
      throw new Error("No lectures to create for the given date range and days");
    }

    await prisma.lecture.createMany({ data: lectures });

    return { created: lectures.length, recurrenceId };
  }

  public async getAll(query: GetLecturesQuery): Promise<{ lectures: LectureResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 20, batchId, teacherId, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isDeleted: false };
    if (batchId) where.batchId = batchId;
    if (teacherId) where.teacherId = teacherId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const [lectures, total] = await Promise.all([
      prisma.lecture.findMany({
        where,
        include: LECTURE_INCLUDE,
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        skip,
        take: limit,
      }),
      prisma.lecture.count({ where }),
    ]);

    return {
      lectures: lectures as LectureResponse[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async getById(id: number): Promise<LectureResponse> {
    const lecture = await prisma.lecture.findFirst({
      where: { id, isDeleted: false },
      include: LECTURE_INCLUDE,
    });

    if (!lecture) throw new Error("Lecture not found");
    return lecture as LectureResponse;
  }

  public async update(id: number, data: UpdateLectureInput): Promise<LectureResponse> {
    await this.getById(id);

    if (data.batchId) {
      const batch = await prisma.batch.findFirst({
        where: { id: data.batchId, isDeleted: false },
      });
      if (!batch) throw new Error("Batch not found");
    }

    let duration: number | undefined;
    if (data.startTime && data.endTime) {
      duration = calculateDuration(data.startTime, data.endTime);
      if (duration <= 0) throw new Error("End time must be after start time");
    }

    const lecture = await prisma.lecture.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.subject && { subject: data.subject }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.room !== undefined && { room: data.room || null }),
        ...(data.batchId && { batchId: data.batchId }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(duration && { duration }),
      },
      include: LECTURE_INCLUDE,
    });

    return lecture as LectureResponse;
  }

  public async assignTeacher(id: number, teacherId: number): Promise<LectureResponse> {
    await this.getById(id);

    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: UserRoles.TEACHER },
    });
    if (!teacher) throw new Error("Teacher not found");

    const lecture = await prisma.lecture.update({
      where: { id },
      data: { teacherId, assignedBy: "admin" },
      include: LECTURE_INCLUDE,
    });

    return lecture as LectureResponse;
  }

  public async updateStatus(id: number, status: LectureStatus, notes?: string): Promise<LectureResponse> {
    await this.getById(id);

    const lecture = await prisma.lecture.update({
      where: { id },
      data: {
        status,
        ...(notes !== undefined && { notes }),
      },
      include: LECTURE_INCLUDE,
    });

    return lecture as LectureResponse;
  }

  public async delete(id: number): Promise<void> {
    await this.getById(id);
    await prisma.lecture.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  public async getSchedule(query: ScheduleQuery): Promise<LectureResponse[]> {
    const where: Record<string, unknown> = {
      isDeleted: false,
      date: {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      },
    };
    if (query.batchId) where.batchId = query.batchId;
    if (query.teacherId) where.teacherId = query.teacherId;

    const lectures = await prisma.lecture.findMany({
      where,
      include: LECTURE_INCLUDE,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return lectures as LectureResponse[];
  }

  private async autoAssignTeacher(subject: string): Promise<number | null> {
    const teachers = await prisma.user.findMany({
      where: { role: UserRoles.TEACHER },
      select: { id: true },
    });

    if (teachers.length === 0) return null;

    // Get the start and end of current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Count lectures per teacher this week
    const lectureCounts = await prisma.lecture.groupBy({
      by: ["teacherId"],
      where: {
        teacherId: { in: teachers.map((t) => t.id) },
        date: { gte: startOfWeek, lt: endOfWeek },
        isDeleted: false,
      },
      _count: { id: true },
    });

    const countMap = new Map<number, number>();
    for (const lc of lectureCounts) {
      if (lc.teacherId !== null) {
        countMap.set(lc.teacherId, lc._count.id);
      }
    }

    // Pick teacher with fewest lectures this week
    let minCount = Infinity;
    let bestTeacherId: number | null = null;

    for (const teacher of teachers) {
      const count = countMap.get(teacher.id) ?? 0;
      if (count < minCount) {
        minCount = count;
        bestTeacherId = teacher.id;
      }
    }

    return bestTeacherId;
  }
}
