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
