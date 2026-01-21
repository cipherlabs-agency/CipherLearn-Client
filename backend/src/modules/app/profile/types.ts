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
  batch: {
    id: number;
    name: string;
    timings: BatchTimings | null;
  } | null;
}
