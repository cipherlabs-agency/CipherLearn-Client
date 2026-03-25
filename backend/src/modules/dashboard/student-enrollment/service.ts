import { Prisma, Student, UserRoles } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  InternalError,
} from "../../../errors";
import {
  EnrollStudentInput,
  CSVStudentRow,
  CSVImportResult,
  CSVImportError,
  CSVPreviewData,
  UpdateStudentInput,
} from "./types";
import { parseCSV, normalizeDateFormat, generateSampleCSV } from "./csv.utils";
import { sendAccountRegistrationEmail } from "../../../utils/email";
import logger from "../../../utils/logger";
import { cacheService } from "../../../cache";
import { DashboardKeys } from "../../../cache/keys";
import * as TTL from "../../../cache/ttl";
import { invalidateAfterStudentMutation } from "../../../cache/invalidation";
import { log } from "../../../utils/logtail";

const FEATURE = "student-enrollment" as const;

export default class StudentEnrollmentService {
  /**
   * Enroll a single student
   * Creates both User (with password=null, isPasswordSet=false) and Student records
   */
  public async enrollSingle(student: EnrollStudentInput): Promise<Student> {
    const normalizedEmail = student.email.toLowerCase();

    // Check if student already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingStudent) {
      throw new ConflictError(
        "Student with this email already exists",
        FEATURE
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictError(
        "A user with this email already exists",
        FEATURE
      );
    }

    // Validate batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: student.batchId },
    });

    if (!batch) {
      throw new NotFoundError(
        `Batch with ID ${student.batchId} not found`,
        FEATURE
      );
    }

    const fullname = this.buildFullname(
      student.firstname,
      student.middlename,
      student.lastname
    );

    const { batchId, ...studentData } = student;

    // Create User + Student together in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create User with password=null, isPasswordSet=false
      const user = await tx.user.create({
        data: {
          name: fullname,
          email: normalizedEmail,
          password: null,
          role: UserRoles.STUDENT,
          isPasswordSet: false,
        },
      });

      // Create Student with userId linking to the new User
      const newStudent = await tx.student.create({
        data: {
          ...studentData,
          email: normalizedEmail,
          fullname,
          userId: user.id,
          batchId: batchId,
        },
      });

      return newStudent;
    });

    invalidateAfterStudentMutation(undefined, student.batchId);

    // Send registration email (non-blocking)
    sendAccountRegistrationEmail(normalizedEmail, fullname, "STUDENT").catch((err) =>
      logger.error("Failed to send student registration email:", err)
    );

    return result;
  }

  /**
   * Preview CSV data before importing
   */
  public async previewCSV(
    fileContent: string,
    batchId: number
  ): Promise<CSVPreviewData> {
    // Validate batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundError(`Batch with ID ${batchId} not found`, FEATURE);
    }

    const { rows, errors } = parseCSV(fileContent);

    // Check for duplicate student emails in database
    const studentEmailsInDB = await prisma.student.findMany({
      where: {
        email: { in: rows.map((r) => r.email.toLowerCase()) },
      },
      select: { email: true },
    });

    // Check for duplicate user emails in database
    const userEmailsInDB = await prisma.user.findMany({
      where: {
        email: { in: rows.map((r) => r.email.toLowerCase()) },
      },
      select: { email: true },
    });

    const existingStudentEmails = new Set(
      studentEmailsInDB.map((s) => s.email.toLowerCase())
    );
    const existingUserEmails = new Set(
      userEmailsInDB.map((u) => u.email.toLowerCase())
    );

    // Check for duplicate emails within CSV
    const emailCounts = new Map<string, number>();
    rows.forEach((row, index) => {
      const email = row.email.toLowerCase();
      if (emailCounts.has(email)) {
        errors.push({
          row: index + 2, // +2 because of header and 0-indexing
          email: row.email,
          error: "Duplicate email in CSV",
        });
      }
      emailCounts.set(email, (emailCounts.get(email) || 0) + 1);

      if (existingStudentEmails.has(email)) {
        errors.push({
          row: index + 2,
          email: row.email,
          error: "Student with this email already exists in database",
        });
      } else if (existingUserEmails.has(email)) {
        errors.push({
          row: index + 2,
          email: row.email,
          error: "User with this email already exists in database",
        });
      }
    });

    // Filter valid rows (no errors)
    const errorRows = new Set(errors.map((e) => e.row));
    const validRows = rows.filter((_, index) => !errorRows.has(index + 2));

    return {
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: errors.length,
      preview: rows.slice(0, 10), // Return first 10 rows for preview
      errors: errors.slice(0, 50), // Limit errors shown
    };
  }

  /**
   * Import students from CSV
   * Creates both User (with password=null, isPasswordSet=false) and Student records for each row
   */
  public async enrollCSV(
    fileContent: string,
    batchId: number
  ): Promise<CSVImportResult> {
    // Validate batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundError(`Batch with ID ${batchId} not found`, FEATURE);
    }

    const { rows, errors } = parseCSV(fileContent);

    if (rows.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: errors.length,
        errors,
        imported: [],
      };
    }

    // Get existing student emails to check for duplicates
    const studentEmailsInDB = await prisma.student.findMany({
      where: {
        email: { in: rows.map((r) => r.email.toLowerCase()) },
      },
      select: { email: true },
    });

    // Get existing user emails to check for duplicates
    const userEmailsInDB = await prisma.user.findMany({
      where: {
        email: { in: rows.map((r) => r.email.toLowerCase()) },
      },
      select: { email: true },
    });

    const existingStudentEmails = new Set(
      studentEmailsInDB.map((s) => s.email.toLowerCase())
    );
    const existingUserEmails = new Set(
      userEmailsInDB.map((u) => u.email.toLowerCase())
    );

    // Track emails being imported to catch duplicates in CSV
    const importedEmails = new Set<string>();
    const imported: Student[] = [];
    const importErrors: CSVImportError[] = [...errors];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = row.email.toLowerCase();

      // Skip if student email already exists
      if (existingStudentEmails.has(email)) {
        importErrors.push({
          row: i + 2,
          email: row.email,
          error: "Student with this email already exists in database",
        });
        continue;
      }

      // Skip if user email already exists
      if (existingUserEmails.has(email)) {
        importErrors.push({
          row: i + 2,
          email: row.email,
          error: "User with this email already exists in database",
        });
        continue;
      }

      if (importedEmails.has(email)) {
        importErrors.push({
          row: i + 2,
          email: row.email,
          error: "Duplicate email in CSV",
        });
        continue;
      }

      try {
        const fullname = this.buildFullname(
          row.firstname.trim(),
          row.middlename?.trim(),
          row.lastname.trim()
        );

        // Create User + Student together in a transaction
        const student = await prisma.$transaction(async (tx) => {
          // Create User with password=null, isPasswordSet=false
          const user = await tx.user.create({
            data: {
              name: fullname,
              email: email,
              password: null,
              role: UserRoles.STUDENT,
              isPasswordSet: false,
            },
          });

          // Create Student with userId linking to the new User
          const newStudent = await tx.student.create({
            data: {
              firstname: row.firstname.trim(),
              middlename: row.middlename?.trim() || "",
              lastname: row.lastname.trim(),
              fullname,
              email: email,
              dob: normalizeDateFormat(row.dob),
              address: row.address?.trim() || "",
              userId: user.id,
              batchId: batchId,
            },
          });

          return newStudent;
        });

        importedEmails.add(email);
        imported.push(student);

        // Send registration email (non-blocking — don't let email failure break the import)
        sendAccountRegistrationEmail(email, fullname, "STUDENT").catch((err) =>
          logger.error(`Failed to send registration email to ${email}:`, err)
        );
      } catch (error) {
        log("error", "dashboard.student-enrollment.error failed", { err: error instanceof Error ? error.message : String(error) });
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create student";
        importErrors.push({
          row: i + 2,
          email: row.email,
          error: errorMessage,
        });
      }
    }

    if (imported.length > 0) {
      invalidateAfterStudentMutation(undefined, batchId);
    }

    return {
      total: rows.length,
      successful: imported.length,
      failed: importErrors.length,
      errors: importErrors,
      imported,
    };
  }

  /**
   * Get all students (optionally filtered by batch) with pagination
   */
  public async getAll(
    batchId?: number,
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<{
    students: Student[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    if (batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        throw new NotFoundError("Batch not found", FEATURE);
      }
    }

    const select: Prisma.StudentSelect = {
      id: true,
      firstname: true,
      middlename: true,
      lastname: true,
      fullname: true,
      email: true,
      dob: true,
      address: true,
      phone: true,
      parentName: true,
      grade: true,
      instituteId: true,
      batchId: true,
      createdAt: true,
      updatedAt: true,
    };

    const where: Prisma.StudentWhereInput = { isDeleted: false };
    if (batchId) where.batchId = batchId;
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { parentName: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const fetcher = async () => {
      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          select,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.student.count({ where }),
      ]);
      return {
        students: students as unknown as Student[],
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    };

    // Cache only the first page with no search filter
    if (page === 1 && !search) {
      return cacheService.getOrSet(
        DashboardKeys.studentList(batchId),
        fetcher,
        TTL.STUDENT_LIST
      );
    }

    return fetcher();
  }

  /**
   * Get a single student by ID
   */
  public async getById(id: number): Promise<Student> {
    const student = await prisma.student.findUnique({
      where: { id, isDeleted: false },
      include: {
        batch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundError("Student not found", FEATURE);
    }

    return student;
  }

  /**
   * Update a student
   */
  public async update(
    id: number,
    data: UpdateStudentInput
  ): Promise<Student> {
    const student = await this.getById(id);

    // If updating email, check for duplicates
    if (data.email && data.email.toLowerCase() !== student.email.toLowerCase()) {
      const normalizedEmail = data.email.toLowerCase();

      const existingStudent = await prisma.student.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingStudent) {
        throw new ConflictError(
          "Email already in use by another student",
          FEATURE
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.id !== student.userId) {
        throw new ConflictError(
          "Email already in use by another user",
          FEATURE
        );
      }
    }

    // If updating batch, validate it exists
    if (data.batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: data.batchId },
      });

      if (!batch) {
        throw new NotFoundError(
          `Batch with ID ${data.batchId} not found`,
          FEATURE
        );
      }
    }

    // Rebuild fullname if name parts are updated
    let fullname = student.fullname;
    if (data.firstname || data.middlename !== undefined || data.lastname) {
      const firstname = data.firstname || student.firstname;
      const middlename =
        data.middlename !== undefined ? data.middlename : student.middlename;
      const lastname = data.lastname || student.lastname;
      fullname = this.buildFullname(firstname, middlename, lastname);
    }

    const { batchId, ...updateData } = data;

    // Normalize email if provided
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...updateData,
        fullname,
        ...(batchId && { batch: { connect: { id: batchId } } }),
      },
    });

    invalidateAfterStudentMutation(id, batchId ?? student.batchId ?? undefined);
    return updated;
  }

  /**
   * Delete (soft) a student
   */
  public async delete(id: number, deletedBy: string): Promise<void> {
    await this.getById(id); // Verify exists

    await prisma.student.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedBy,
      },
    });

    invalidateAfterStudentMutation(id);
  }

  /**
   * Get sample CSV template
   */
  public getSampleCSV(): string {
    return generateSampleCSV();
  }

  /**
   * Get student profile by email (for authenticated student users)
   */
  public async getByEmail(email: string): Promise<Student | null> {
    const student = await prisma.student.findUnique({
      where: { email: email.toLowerCase(), isDeleted: false },
      include: {
        batch: {
          select: { id: true, name: true },
        },
      },
    });

    return student;
  }

  /**
   * Get all soft-deleted students
   */
  public async getDeleted(): Promise<Student[]> {
    return cacheService.getOrSet(
      DashboardKeys.studentDeletedList(),
      () =>
        prisma.student.findMany({
          where: { isDeleted: true },
          include: { batch: { select: { id: true, name: true } } },
          orderBy: { updatedAt: "desc" },
        }),
      TTL.STUDENT_DELETED_LIST
    ) as Promise<Student[]>;
  }

  /**
   * Restore soft-deleted students
   */
  public async restore(ids: number[]): Promise<{ restored: number }> {
    const result = await prisma.student.updateMany({
      where: {
        id: { in: ids },
        isDeleted: true,
      },
      data: {
        isDeleted: false,
        deletedBy: null,
      },
    });

    invalidateAfterStudentMutation();
    return { restored: result.count };
  }

  // =====================
  // DANGER ZONE - HARD DELETE OPERATIONS
  // =====================

  /**
   * Permanently delete a student (DANGER: This cannot be undone!)
   */
  public async hardDelete(id: number): Promise<void> {
    // First check if student exists
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundError("Student not found", FEATURE);
    }

    // Delete related records and student in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related attendance records
      await tx.attendance.deleteMany({
        where: { studentId: id },
      });

      // Delete related submissions
      await tx.studentSubmission.deleteMany({
        where: { studentId: id },
      });

      // Delete the student
      await tx.student.delete({
        where: { id },
      });

      // Delete linked user if exists
      if (student.userId) {
        await tx.user.delete({
          where: { id: student.userId },
        });
      }
    });

    invalidateAfterStudentMutation(id);
  }

  /**
   * Permanently delete multiple students (DANGER: This cannot be undone!)
   */
  public async hardDeleteMany(ids: number[]): Promise<{ deleted: number }> {
    // Get students with their user IDs
    const students = await prisma.student.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true },
    });

    const studentIds = students.map((s) => s.id);
    const userIds = students.filter((s) => s.userId).map((s) => s.userId as number);

    // Delete related records and students in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related attendance records
      await tx.attendance.deleteMany({
        where: { studentId: { in: studentIds } },
      });

      // Delete related submissions
      await tx.studentSubmission.deleteMany({
        where: { studentId: { in: studentIds } },
      });

      // Delete the students
      await tx.student.deleteMany({
        where: { id: { in: studentIds } },
      });

      // Delete linked users if any
      if (userIds.length > 0) {
        await tx.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    });

    invalidateAfterStudentMutation();
    return { deleted: studentIds.length };
  }

  /**
   * Permanently delete all soft-deleted students (DANGER: This cannot be undone!)
   */
  public async purgeDeleted(): Promise<{ deleted: number }> {
    const deletedStudents = await prisma.student.findMany({
      where: { isDeleted: true },
      select: { id: true, userId: true },
    });

    if (deletedStudents.length === 0) {
      return { deleted: 0 };
    }

    const ids = deletedStudents.map((s) => s.id);
    return this.hardDeleteMany(ids);
  }

  // =====================
  // PRIVATE HELPER METHODS
  // =====================

  /**
   * Build fullname from parts
   */
  private buildFullname(
    firstname: string,
    middlename: string | undefined | null,
    lastname: string
  ): string {
    const parts = [firstname];
    if (middlename && middlename.trim()) {
      parts.push(middlename.trim());
    }
    parts.push(lastname);
    return parts.join(" ");
  }
}
