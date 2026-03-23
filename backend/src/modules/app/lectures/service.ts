import { prisma } from "../../../config/db.config";
import { LectureStatus } from "../../../../prisma/generated/prisma/enums";
import { AppLectureResponse, DailyScheduleResponse } from "./types";

const LECTURE_INCLUDE = {
  batch: { select: { id: true, name: true } },
  teacher: { select: { id: true, name: true } },
} as const;

function computeStatus(lecture: { date: Date; startTime: string; endTime: string; status: string }): LectureStatus {
  if (lecture.status === "CANCELLED" || lecture.status === "COMPLETED") {
    return lecture.status as LectureStatus;
  }

  const now = new Date();
  const lectureDate = new Date(lecture.date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lectureDateOnly = new Date(lectureDate.getFullYear(), lectureDate.getMonth(), lectureDate.getDate());

  if (lectureDateOnly.getTime() !== today.getTime()) {
    return lectureDateOnly < today ? LectureStatus.COMPLETED : LectureStatus.SCHEDULED;
  }

  const [sh, sm] = lecture.startTime.split(":").map(Number);
  const [eh, em] = lecture.endTime.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    return LectureStatus.IN_PROGRESS;
  } else if (currentMinutes >= endMinutes) {
    return LectureStatus.COMPLETED;
  }

  return LectureStatus.SCHEDULED;
}

function getNextClass(lectures: AppLectureResponse[]): DailyScheduleResponse["nextClass"] {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const lecture of lectures) {
    const [sh, sm] = lecture.startTime.split(":").map(Number);
    const startMinutes = sh * 60 + sm;

    if (startMinutes > currentMinutes && lecture.status === LectureStatus.SCHEDULED) {
      const diff = startMinutes - currentMinutes;
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      const startsIn = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      return { subject: lecture.subject, startsIn };
    }
  }

  return null;
}

export default class AppLectureService {
  public async getTeacherSchedule(teacherId: number, date?: string): Promise<DailyScheduleResponse> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const lectures = await prisma.lecture.findMany({
      where: {
        teacherId,
        date: { gte: startOfDay, lt: endOfDay },
        isDeleted: false,
      },
      include: LECTURE_INCLUDE,
      orderBy: { startTime: "asc" },
    });

    const enriched: AppLectureResponse[] = lectures.map((l) => ({
      ...l,
      status: computeStatus(l),
      teacher: l.teacher,
      batch: l.batch,
    }));

    return {
      date: startOfDay.toISOString().split("T")[0],
      totalClasses: enriched.length,
      lectures: enriched,
      nextClass: getNextClass(enriched),
    };
  }

  public async getStudentSchedule(batchId: number, date?: string): Promise<DailyScheduleResponse> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const lectures = await prisma.lecture.findMany({
      where: {
        batchId,
        date: { gte: startOfDay, lt: endOfDay },
        isDeleted: false,
        status: { not: LectureStatus.CANCELLED },
      },
      include: LECTURE_INCLUDE,
      orderBy: { startTime: "asc" },
    });

    const enriched: AppLectureResponse[] = lectures.map((l) => ({
      ...l,
      status: computeStatus(l),
      teacher: l.teacher,
      batch: l.batch,
    }));

    return {
      date: startOfDay.toISOString().split("T")[0],
      totalClasses: enriched.length,
      lectures: enriched,
      nextClass: getNextClass(enriched),
    };
  }

  public async getLectureById(id: number): Promise<AppLectureResponse> {
    const lecture = await prisma.lecture.findFirst({
      where: { id, isDeleted: false },
      include: LECTURE_INCLUDE,
    });

    if (!lecture) throw new Error("Lecture not found");

    return {
      ...lecture,
      status: computeStatus(lecture),
      teacher: lecture.teacher,
      batch: lecture.batch,
    };
  }

  public async addNotes(lectureId: number, teacherId: number, notes: string): Promise<AppLectureResponse> {
    const lecture = await prisma.lecture.findFirst({
      where: { id: lectureId, teacherId, isDeleted: false },
    });
    if (!lecture) throw new Error("Lecture not found or not assigned to you");

    const updated = await prisma.lecture.update({
      where: { id: lectureId },
      data: { notes },
      include: LECTURE_INCLUDE,
    });

    return {
      ...updated,
      status: computeStatus(updated),
      teacher: updated.teacher,
      batch: updated.batch,
    };
  }

  public async markComplete(lectureId: number, teacherId: number, notes?: string): Promise<AppLectureResponse> {
    const lecture = await prisma.lecture.findFirst({
      where: { id: lectureId, teacherId, isDeleted: false },
    });
    if (!lecture) throw new Error("Lecture not found or not assigned to you");

    const updated = await prisma.lecture.update({
      where: { id: lectureId },
      data: {
        status: LectureStatus.COMPLETED,
        ...(notes && { notes }),
      },
      include: LECTURE_INCLUDE,
    });

    return {
      ...updated,
      teacher: updated.teacher,
      batch: updated.batch,
    };
  }

  // ==================== TEACHER CRUD ====================

  public async createLecture(data: {
    title: string;
    subject: string;
    batchId: number;
    date: Date;
    startTime: string;
    endTime: string;
    room?: string;
    description?: string;
    isOnline?: boolean;
    meetingLink?: string;
    attachments?: unknown;
    teacherId: number;
    createdByName: string;
  }): Promise<AppLectureResponse> {
    const [sh, sm] = data.startTime.split(":").map(Number);
    const [eh, em] = data.endTime.split(":").map(Number);
    const duration = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));

    const lecture = await prisma.lecture.create({
      data: {
        title: data.title,
        subject: data.subject,
        batchId: data.batchId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        duration,
        room: data.room,
        description: data.description,
        isOnline: data.isOnline ?? false,
        meetingLink: data.meetingLink,
        attachments: data.attachments as any,
        teacherId: data.teacherId,
        assignedBy: data.createdByName,
        createdBy: data.teacherId,
        status: LectureStatus.SCHEDULED,
      },
      include: LECTURE_INCLUDE,
    });

    return {
      ...lecture,
      status: computeStatus(lecture),
      teacher: lecture.teacher,
      batch: lecture.batch,
    };
  }

  public async updateLecture(
    lectureId: number,
    teacherId: number,
    data: {
      title?: string;
      subject?: string;
      batchId?: number;
      date?: Date;
      startTime?: string;
      endTime?: string;
      room?: string;
      description?: string;
      isOnline?: boolean;
      meetingLink?: string;
      status?: LectureStatus;
      attachments?: unknown;
    }
  ): Promise<AppLectureResponse> {
    const lecture = await prisma.lecture.findFirst({
      where: { id: lectureId, teacherId, isDeleted: false },
    });
    if (!lecture) throw new Error("Lecture not found or not assigned to you");

    const updateData: Record<string, unknown> = { ...data };
    // Recompute duration if times changed
    const startTime = data.startTime ?? lecture.startTime;
    const endTime = data.endTime ?? lecture.endTime;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    updateData.duration = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));

    const updated = await prisma.lecture.update({
      where: { id: lectureId },
      data: updateData as any,
      include: LECTURE_INCLUDE,
    });

    return {
      ...updated,
      status: computeStatus(updated),
      teacher: updated.teacher,
      batch: updated.batch,
    };
  }

  public async deleteLecture(lectureId: number, teacherId: number): Promise<void> {
    const lecture = await prisma.lecture.findFirst({
      where: { id: lectureId, teacherId, isDeleted: false },
    });
    if (!lecture) throw new Error("Lecture not found or not assigned to you");

    await prisma.lecture.update({
      where: { id: lectureId },
      data: { isDeleted: true, status: LectureStatus.CANCELLED },
    });
  }
}
