import { prisma } from "../../../config/db.config";
import type { StudentProfile } from "./types";
import type { BatchTimings } from "../types";

class ProfileService {
  /**
   * Get student profile with batch info
   */
  async getProfile(studentId: number): Promise<StudentProfile> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            timings: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    return {
      id: student.id,
      firstname: student.firstname,
      middlename: student.middlename,
      lastname: student.lastname,
      fullname: student.fullname,
      email: student.email,
      dob: student.dob || null,
      address: student.address,
      batch: student.batch
        ? {
            id: student.batch.id,
            name: student.batch.name,
            timings: student.batch.timings as BatchTimings | null,
          }
        : null,
    };
  }
}

export const profileService = new ProfileService();
