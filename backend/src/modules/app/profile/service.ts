import { prisma } from "../../../config/db.config";
import { cacheService } from "../../../cache/index";
import { AppKeys } from "../../../cache/keys";
import { APP_PROFILE } from "../../../cache/ttl";
import CloudinaryService from "../../../config/cloudinairy.config";
import type {
  StudentProfile,
  UpdateStudentProfileInput,
  TeacherProfileResponse,
  UpdateTeacherProfileInput,
  MyTeacherResponse,
} from "./types";
import type { BatchTimings } from "../types";

const cloudinary = new CloudinaryService();

class ProfileService {
  /**
   * Get student profile with batch info and derived classTeacher
   */
  async getProfile(studentId: number): Promise<StudentProfile> {
    return cacheService.getOrSet(
      AppKeys.profile(studentId),
      async () => {
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
          avatarUrl: student.avatarUrl ?? null,
          classTeacher,
          batch: student.batch
            ? {
                id: student.batch.id,
                name: student.batch.name,
                timings: student.batch.timings as BatchTimings | null,
              }
            : null,
        };
      },
      APP_PROFILE
    );
  }
  /**
   * Student: update their own profile (phone, address, parentName only)
   */
  async updateStudentProfile(studentId: number, data: UpdateStudentProfileInput): Promise<StudentProfile> {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        ...(data.phone !== undefined && { phone: data.phone.trim() || null }),
        ...(data.address !== undefined && { address: data.address.trim() || null }),
        ...(data.parentName !== undefined && { parentName: data.parentName.trim() || null }),
      },
    });
    // Invalidate profile cache
    await cacheService.delByPrefix(`app:profile:${studentId}`);
    return this.getProfile(studentId);
  }

  /**
   * Teacher: get own profile with extended info
   */
  async getTeacherProfile(userId: number): Promise<TeacherProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { teacherProfile: true },
    });
    if (!user) throw new Error("Teacher not found");

    // Compute workload: distinct batches + weekly hours from lectures
    const [batchGroups, lectures] = await Promise.all([
      prisma.lecture.findMany({
        where: { teacherId: userId, isDeleted: false },
        select: {
          batchId: true,
          startTime: true,
          endTime: true,
          batch: { select: { name: true } },
        },
        distinct: ["batchId"],
      }),
      prisma.lecture.findMany({
        where: { teacherId: userId, isDeleted: false },
        select: { startTime: true, endTime: true },
      }),
    ]);

    const weeklyHours = Math.round(
      lectures.reduce((acc, l) => {
        const [sh, sm] = l.startTime.split(":").map(Number);
        const [eh, em] = l.endTime.split(":").map(Number);
        return acc + (eh * 60 + em - (sh * 60 + sm)) / 60;
      }, 0)
    );

    // Distinct batch names for the grade chips (e.g. ["Grade 9-A", "Grade 10-B"])
    const grades = batchGroups
      .map((b) => b.batch.name)
      .sort();

    const tp = user.teacherProfile;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: tp?.phone ?? null,
      gender: tp?.gender ?? null,
      qualification: tp?.qualification ?? null,
      university: tp?.university ?? null,
      experience: tp?.experience ?? null,
      workTimingFrom: tp?.workTimingFrom ?? null,
      workTimingTo: tp?.workTimingTo ?? null,
      primarySubjects: tp?.primarySubjects ?? [],
      secondarySubjects: tp?.secondarySubjects ?? [],
      bio: tp?.bio ?? null,
      avatarUrl: tp?.avatarUrl ?? null,
      batchesTaught: batchGroups.length,
      weeklyHours,
      grades,
    };
  }

  /**
   * Teacher: update own extended profile
   */
  async updateTeacherProfile(userId: number, data: UpdateTeacherProfileInput): Promise<TeacherProfileResponse> {
    await prisma.teacherProfile.upsert({
      where: { userId },
      create: {
        userId,
        phone: data.phone?.trim() ?? null,
        gender: data.gender?.trim() ?? null,
        qualification: data.qualification?.trim() ?? null,
        university: data.university?.trim() ?? null,
        experience: data.experience ?? null,
        workTimingFrom: data.workTimingFrom ?? null,
        workTimingTo: data.workTimingTo ?? null,
        primarySubjects: data.primarySubjects ?? [],
        secondarySubjects: data.secondarySubjects ?? [],
        bio: data.bio?.trim() ?? null,
      },
      update: {
        ...(data.phone !== undefined && { phone: data.phone.trim() || null }),
        ...(data.gender !== undefined && { gender: data.gender.trim() || null }),
        ...(data.qualification !== undefined && { qualification: data.qualification.trim() || null }),
        ...(data.university !== undefined && { university: data.university.trim() || null }),
        ...(data.experience !== undefined && { experience: data.experience }),
        ...(data.workTimingFrom !== undefined && { workTimingFrom: data.workTimingFrom }),
        ...(data.workTimingTo !== undefined && { workTimingTo: data.workTimingTo }),
        ...(data.primarySubjects !== undefined && { primarySubjects: data.primarySubjects }),
        ...(data.secondarySubjects !== undefined && { secondarySubjects: data.secondarySubjects }),
        ...(data.bio !== undefined && { bio: data.bio?.trim() ?? null }),
      },
    });
    return this.getTeacherProfile(userId);
  }

  /**
   * Student: upload avatar photo
   */
  async updateStudentAvatar(studentId: number, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
    const uploaded = await cloudinary.uploadDocument(file, "avatars/students");
    await prisma.student.update({
      where: { id: studentId },
      data: { avatarUrl: uploaded.url },
    });
    await cacheService.delByPrefix(`app:profile:${studentId}`);
    return { avatarUrl: uploaded.url };
  }

  /**
   * Teacher: upload avatar photo
   */
  async updateTeacherAvatar(userId: number, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
    const uploaded = await cloudinary.uploadDocument(file, "avatars/teachers");
    await prisma.teacherProfile.upsert({
      where: { userId },
      create: { userId, avatarUrl: uploaded.url, primarySubjects: [], secondarySubjects: [] },
      update: { avatarUrl: uploaded.url },
    });
    return { avatarUrl: uploaded.url };
  }

  /**
   * Teacher: get own profile with extended info (includes avatarUrl)
   */
  private async buildTeacherProfileResponse(userId: number): Promise<TeacherProfileResponse> {
    return this.getTeacherProfile(userId);
  }

  /**
   * Student: get their class teacher's info (for Ask Doubts screen)
   */
  async getMyTeacher(studentId: number, batchId: number): Promise<MyTeacherResponse | null> {
    // Find the most frequent teacher for this student's batch
    const topTeacher = await prisma.lecture.groupBy({
      by: ["teacherId"],
      where: { batchId, teacherId: { not: null }, isDeleted: false },
      _count: { teacherId: true },
      orderBy: { _count: { teacherId: "desc" } },
      take: 1,
    });

    if (!topTeacher.length || !topTeacher[0].teacherId) return null;

    const teacherId = topTeacher[0].teacherId;
    const user = await prisma.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true },
    });
    if (!user) return null;

    const tp = user.teacherProfile;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: tp?.phone ?? null,
      qualification: tp?.qualification ?? null,
      experience: tp?.experience ?? null,
      workTimingFrom: tp?.workTimingFrom ?? null,
      workTimingTo: tp?.workTimingTo ?? null,
      primarySubjects: tp?.primarySubjects ?? [],
      secondarySubjects: tp?.secondarySubjects ?? [],
      bio: tp?.bio ?? null,
    };
  }
}

export const profileService = new ProfileService();
