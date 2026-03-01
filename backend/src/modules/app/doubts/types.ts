import { DoubtStatus } from "../../../../prisma/generated/prisma/enums";

export interface PostDoubtInput {
  title: string;
  description: string;
  subject?: string;
}

export interface ReplyDoubtInput {
  body: string;
}

export interface DoubtReplyItem {
  id: number;
  body: string;
  createdAt: Date;
  user: { id: number; name: string; role: string };
  isTeacher: boolean;
}

export interface DoubtItem {
  id: number;
  title: string;
  description: string;
  subject: string | null;
  status: DoubtStatus;
  replyCount: number;
  lastReplyAt: Date | null;
  createdAt: Date;
  student?: { id: number; fullname: string; grade: string | null };
}

export interface DoubtThread extends DoubtItem {
  replies: DoubtReplyItem[];
}

export interface DoubtListResponse {
  doubts: DoubtItem[];
  total: number;
  page: number;
  limit: number;
}
