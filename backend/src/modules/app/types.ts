import { Student, Batch } from "../../../prisma/generated/prisma/client";

// Extend Express Request to include student
declare global {
  namespace Express {
    interface Request {
      student?: Student & { batch: Batch | null };
    }
  }
}

// Common types used across app modules
export interface BatchTimings {
  time?: string;
  days?: string[];
  startTime?: string;
  endTime?: string;
}

// Re-export types from sub-modules for convenience
export * from "./profile/types";
export * from "./dashboard/types";
export * from "./attendance/types";
export * from "./assignments/types";
export * from "./announcements/types";
export * from "./resources/types";
export * from "./fees/types";
