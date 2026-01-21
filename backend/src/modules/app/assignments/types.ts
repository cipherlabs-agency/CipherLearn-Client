import { SubmissionStatus } from "../../../../prisma/generated/prisma/client";

export interface UpcomingAssignment {
  id: number;
  title: string;
  subject: string | null;
  description: string | null;
  dueDate: string | null;
  isOverdue: boolean;
  daysRemaining: number | null;
  hasSubmitted: boolean;
  submissionStatus: SubmissionStatus | null;
}
