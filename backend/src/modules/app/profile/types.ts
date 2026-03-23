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
  avatarUrl: string | null;
  classTeacher: string | null;
  batch: {
    id: number;
    name: string;
    timings: BatchTimings | null;
  } | null;
}

export interface UpdateStudentProfileInput {
  phone?: string;
  address?: string;
  parentName?: string;
}

export interface TeacherProfileResponse {
  id: number;
  name: string;
  email: string;
  // TeacherProfile fields
  phone: string | null;
  gender: string | null;
  qualification: string | null;
  university: string | null;
  experience: number | null;
  workTimingFrom: string | null;
  workTimingTo: string | null;
  primarySubjects: string[];
  secondarySubjects: string[];
  bio: string | null;
  avatarUrl: string | null;
  // Computed workload
  batchesTaught: number;
  weeklyHours: number;
  // Distinct batch names the teacher currently teaches (e.g. ["Grade 9-A", "Grade 10-B"])
  grades: string[];
}

export interface UpdateTeacherProfileInput {
  phone?: string;
  gender?: string;
  qualification?: string;
  university?: string;
  experience?: number;
  workTimingFrom?: string;
  workTimingTo?: string;
  primarySubjects?: string[];
  secondarySubjects?: string[];
  bio?: string;
}

export interface MyTeacherResponse {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  qualification: string | null;
  experience: number | null;
  workTimingFrom: string | null;
  workTimingTo: string | null;
  primarySubjects: string[];
  secondarySubjects: string[];
  bio: string | null;
}
