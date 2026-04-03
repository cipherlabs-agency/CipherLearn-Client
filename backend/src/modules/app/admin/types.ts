// ─── Batch ───────────────────────────────────────────────────────────────────

export interface AdminBatchListItem {
  id: number;
  name: string;
  timings: unknown;
  totalStudents: unknown;
  studentCount: number;
  createdAt: Date | null;
}

export interface CreateBatchInput {
  name: string;
  timings?: unknown;
}

export interface UpdateBatchInput {
  name?: string;
  timings?: unknown;
}

// ─── Student ─────────────────────────────────────────────────────────────────

export interface AdminStudentListItem {
  id: number;
  fullname: string;
  email: string;
  phone: string | null;
  batchId: number | null;
  batch: { id: number; name: string } | null;
  grade: string | null;
  instituteId: string | null;
  isDeleted: boolean | null;
  createdAt: Date | null;
  userId: number | null;
  isPasswordSet: boolean;
}

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

export interface UpdateStudentInput {
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

// ─── Teacher ─────────────────────────────────────────────────────────────────

export interface AdminTeacherListItem {
  id: number;
  name: string;
  email: string;
  isPasswordSet: boolean;
  createdAt: Date | null;
}

export interface CreateTeacherInput {
  name: string;
  email: string;
}

export interface UpdateTeacherInput {
  name?: string;
  email?: string;
}

// ─── Fee Structure ────────────────────────────────────────────────────────────

export interface AdminFeeStructureListItem {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  batchId: number;
  dueDay: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateFeeStructureInput {
  name: string;
  amount: number;
  frequency: string;
  batchId: number;
  dueDay?: number;
}

export interface UpdateFeeStructureInput {
  name?: string;
  amount?: number;
  frequency?: string;
  dueDay?: number | null;
  isActive?: boolean;
}
