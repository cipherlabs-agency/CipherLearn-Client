import { UserRoles } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import { CreateTeacherInput, UpdateTeacherInput, TeacherResponse } from "./types";
import { sendAccountRegistrationEmail } from "../../../utils/email";
import logger from "../../../utils/logger";

export default class TeacherService {
  /**
   * Create a new teacher (creates User with role TEACHER)
   */
  public async create(data: CreateTeacherInput): Promise<TeacherResponse> {
    const normalizedEmail = data.email.toLowerCase();

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: normalizedEmail,
        password: null,
        role: UserRoles.TEACHER,
        isPasswordSet: false,
      },
    });

    // Send registration email (non-blocking)
    sendAccountRegistrationEmail(normalizedEmail, data.name, "TEACHER").catch((err) =>
      logger.error("Failed to send teacher registration email:", err)
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isPasswordSet: user.isPasswordSet,
      createdAt: user.createdAt,
    };
  }

  /**
   * Get all teachers
   */
  public async getAll(page = 1, limit = 20, search?: string): Promise<{ teachers: TeacherResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const where = {
      role: UserRoles.TEACHER,
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [total, teachers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          isPasswordSet: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      teachers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single teacher by ID
   */
  public async getById(id: number): Promise<TeacherResponse> {
    const teacher = await prisma.user.findFirst({
      where: { id, role: UserRoles.TEACHER },
      select: {
        id: true,
        name: true,
        email: true,
        isPasswordSet: true,
        createdAt: true,
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    return teacher;
  }

  /**
   * Update a teacher
   */
  public async update(id: number, data: UpdateTeacherInput): Promise<TeacherResponse> {
    // Verify teacher exists
    const teacher = await this.getById(id);

    // If updating email, check for duplicates
    if (data.email && data.email.toLowerCase() !== teacher.email) {
      const normalizedEmail = data.email.toLowerCase();
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing) {
        throw new Error("A user with this email already exists");
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email.toLowerCase() }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isPasswordSet: true,
        createdAt: true,
      },
    });

    return updated;
  }

  /**
   * Delete a teacher (hard delete)
   */
  public async delete(id: number): Promise<void> {
    // Verify teacher exists
    await this.getById(id);

    // Delete associated password reset tokens first
    await prisma.passwordResetToken.deleteMany({
      where: { userId: id },
    });

    // Delete the user
    await prisma.user.delete({
      where: { id },
    });
  }
}
