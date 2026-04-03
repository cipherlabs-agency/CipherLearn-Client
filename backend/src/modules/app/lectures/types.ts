import { LectureStatus } from "../../../../prisma/generated/prisma/enums";

export interface LectureAttachment {
  url: string;
  publicId: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface AppLectureResponse {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  room: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: LectureStatus;
  notes: string | null;
  isOnline?: boolean;
  meetingLink?: string | null;
  attachments: LectureAttachment[];
  teacher: { id: number; name: string } | null;
  batch: { id: number; name: string };
}

export interface DailyScheduleResponse {
  date: string;
  totalClasses: number;
  lectures: AppLectureResponse[];
  nextClass: {
    subject: string;
    startsIn: string;
  } | null;
}
