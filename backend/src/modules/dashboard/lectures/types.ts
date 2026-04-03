import { LectureStatus } from "../../../../prisma/generated/prisma/enums";

export interface LectureAttachment {
  url: string;
  publicId: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface CreateLectureInput {
  title: string;
  subject: string;
  description?: string;
  room?: string;
  batchId: number;
  teacherId?: number | null;
  autoAssign?: boolean;
  date: string;
  startTime: string;
  endTime: string;
  attachments?: LectureAttachment[];
}

export interface CreateBulkLecturesInput {
  title: string;
  subject: string;
  description?: string;
  room?: string;
  batchId: number;
  teacherId?: number | null;
  startTime: string;
  endTime: string;
  recurrence: {
    days: string[];
    startDate: string;
    endDate: string;
  };
}

export interface UpdateLectureInput {
  title?: string;
  subject?: string;
  description?: string;
  room?: string;
  batchId?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
}

export interface LectureResponse {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  room: string | null;
  batchId: number;
  batch: { id: number; name: string };
  teacherId: number | null;
  teacher: { id: number; name: string } | null;
  assignedBy: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: LectureStatus;
  notes: string | null;
  recurrenceId: string | null;
  createdBy: number;
  createdAt: Date;
}

export interface GetLecturesQuery {
  batchId?: number;
  teacherId?: number;
  status?: LectureStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ScheduleQuery {
  batchId?: number;
  teacherId?: number;
  startDate: string;
  endDate: string;
}
