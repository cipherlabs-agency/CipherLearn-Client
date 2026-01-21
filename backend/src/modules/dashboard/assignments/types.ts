/**
 * Assignment Module Types
 * Defines interfaces for assignment slots and student submissions
 */

export interface CreateAssignmentSlotInput {
  title: string;
  subject: string;
  description?: string;
  batchId: number;
  dueDate?: Date | string;
  createdBy: string;
}

export interface UpdateAssignmentSlotInput {
  title?: string;
  subject?: string;
  description?: string;
  batchId?: number;
  dueDate?: Date | string;
}

export interface GetAssignmentSlotsQuery {
  batchId?: number;
  page?: number;
  limit?: number;
  includeExpired?: boolean;
}

export interface CreateSubmissionInput {
  slotId: number;
  studentId: number;
  files: string[]; // Array of file URLs
}

export interface UpdateSubmissionInput {
  files?: string[];
}

export interface ReviewSubmissionInput {
  status: "ACCEPTED" | "REJECTED";
  feedback?: string;
  reviewedBy: string;
}

export interface GetSubmissionsQuery {
  slotId?: number;
  studentId?: number;
  status?: "PENDING" | "ACCEPTED" | "REJECTED";
  page?: number;
  limit?: number;
}

export interface SubmissionFile {
  url: string;
  public_id: string;
  original_filename: string;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
}
