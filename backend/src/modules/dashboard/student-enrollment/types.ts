export type Student = {
  email: string;
  firstname: string;
  middlename: string;
  lastname: string;
  fullname: string;
  dob: string;
  batchId?: number;
  attendance?: Record<string, {}>;
  address?: string;
  updatedAt?: Date;
  createdAt?: Date;
};

export interface EnrollStudentInput {
  email: string;
  firstname: string;
  middlename: string;
  lastname: string;
  fullname?: string;
  dob: string;
  batchId: number;
  address: string;
}

export type StudentCSV = Student[];

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
  imported: any[];
}

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
