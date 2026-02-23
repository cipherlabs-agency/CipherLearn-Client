import { SubmissionStatus } from "../../../../prisma/generated/prisma/client";

export interface UpcomingAssignment {
  id: number;
  title: string;
  subject: string | null;
  description: string | null;
  attachments: string[];
  dueDate: string | null;
  isOverdue: boolean;
  daysRemaining: number | null;
  hasSubmitted: boolean;
  submissionStatus: SubmissionStatus | null;
  submission?: StudentSubmissionDetails | null;
}

export interface AssignmentDetails extends UpcomingAssignment {
  batch: {
    id: number;
    name: string;
  };
  createdAt: string;
  createdBy: string;
}

export interface StudentSubmissionDetails {
  id: number;
  files: SubmissionFile[];
  note: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface SubmissionFile {
  url: string;
  publicId: string;         // Cloudinary public_id for deletion
  originalFilename: string;
  size: number;             // bytes
  mimeType: string;
}

export interface CreateSubmissionInput {
  slotId: number;
  files: SubmissionFile[];
  note?: string;            // Optional text note from student
}

export interface ReviewSubmissionInput {
  status: "ACCEPTED" | "REJECTED";
  feedback?: string;
}

// Teacher/Admin view types
export interface AssignmentSlotWithStats {
  id: number;
  title: string;
  subject: string | null;
  description: string | null;
  attachments: string[];
  dueDate: string | null;
  createdAt: string;
  createdBy: string;
  batch: {
    id: number;
    name: string;
  };
  stats: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
}

export interface SubmissionWithStudent {
  id: number;
  files: SubmissionFile[];
  note: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  student: {
    id: number;
    fullname: string;
    email: string;
  };
  slot: {
    id: number;
    title: string;
    subject: string | null;
  };
}

export interface GetAssignmentsQuery {
  batchId?: number;
  page?: number;
  limit?: number;
  includeExpired?: boolean;
  /** For student list: "pending" | "completed" tabs */
  status?: "pending" | "completed";
}

export interface GetSubmissionsQuery {
  slotId?: number;
  status?: SubmissionStatus;
  page?: number;
  limit?: number;
}
