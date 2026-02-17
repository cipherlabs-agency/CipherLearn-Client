import { prisma } from "../../../config/db.config";
import type { StudentProfile } from "./types";
import type { BatchTimings } from "../types";

class ProfileService {
  /**
   * Get student profile with batch info and derived classTeacher
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

    // Derive classTeacher: find the most frequent teacher for this student's batch
    let classTeacher: string | null = null;
    if (student.batchId) {
      const topTeacher = await prisma.lecture.groupBy({
        by: ["teacherId"],
        where: {
          batchId: student.batchId,
          teacherId: { not: null },
        },
        _count: { teacherId: true },
        orderBy: { _count: { teacherId: "desc" } },
        take: 1,
      });

      if (topTeacher.length > 0 && topTeacher[0].teacherId) {
        const teacher = await prisma.user.findUnique({
          where: { id: topTeacher[0].teacherId },
          select: { name: true },
        });
        classTeacher = teacher?.name ?? null;
      }
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
      phone: student.phone,
      parentName: student.parentName,
      grade: student.grade,
      instituteId: student.instituteId,
      classTeacher,
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
