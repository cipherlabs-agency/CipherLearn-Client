import type { BatchTimings } from "../types";

export interface StudentProfile {
  id: number;
  firstname: string;
  middlename: string | null;
  lastname: string;
  fullname: string;
  email: string;
  dob: string | null;
  address: string | null;
  phone: string | null;
  parentName: string | null;
  grade: string | null;
  instituteId: string | null;
  classTeacher: string | null;
  batch: {
    id: number;
    name: string;
    timings: BatchTimings | null;
  } | null;
}
