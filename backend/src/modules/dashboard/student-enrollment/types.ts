import type { Student as PrismaStudent } from "../../../../prisma/generated/prisma/client";

/**
 * Student type extending Prisma Student
 */
export type Student = PrismaStudent & {
  batch?: {
    id: number;
    name: string;
  };
};

/**
 * Input for enrolling a new student
 */
export interface EnrollStudentInput {
  email: string;
  firstname: string;
  middlename: string;
  lastname: string;
  dob: string;
  batchId: number;
  address: string;
  phone?: string;
  parentName?: string;
  grade?: string;
  instituteId?: string;
}

/**
 * Input for updating a student
 */
export interface UpdateStudentInput {
  email?: string;
  firstname?: string;
  middlename?: string;
  lastname?: string;
  dob?: string;
  batchId?: number;
  address?: string;
  phone?: string;
  parentName?: string;
  grade?: string;
  instituteId?: string;
}

/**
 * CSV Row structure for student import
 */
export interface CSVStudentRow {
  firstname: string;
  middlename?: string;
  lastname: string;
  email: string;
  dob: string;
  address?: string;
  batchId?: number;
}

/**
 * CSV Import result
 */
export interface CSVImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: CSVImportError[];
  imported: PrismaStudent[];
}

/**
 * CSV Import error for a single row
 */
export interface CSVImportError {
  row: number;
  email?: string;
  error: string;
}

/**
 * CSV Preview data for frontend confirmation
 */
export interface CSVPreviewData {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  preview: CSVStudentRow[];
  errors: CSVImportError[];
}

/**
 * API Response wrapper
 */
export interface StudentApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  code?: string;
}
