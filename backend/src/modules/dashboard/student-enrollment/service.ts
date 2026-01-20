import { Prisma, Student } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import {
  EnrollStudentInput,
  CSVStudentRow,
  CSVImportResult,
  CSVImportError,
  CSVPreviewData,
} from "./types";
import { parseCSV, normalizeDateFormat, generateSampleCSV } from "./csv.utils";

export default class StudentEnrollmentService {
  /**
   * Enroll a single student
   */
  public async enrollSingle(student: EnrollStudentInput): Promise<Student> {
    try {
      const alreadyExist = await prisma.student.findUnique({
        where: { email: student.email },
      });

      if (alreadyExist) {
        throw new Error("Student with this email already exists");
      }

      // Validate batch exists
      const batch = await prisma.batch.findUnique({
        where: { id: student.batchId },
      });

      if (!batch) {
        throw new Error(`Batch with ID ${student.batchId} not found`);
      }

      const { batchId, ...studentData } = student;

      const newStudent = await prisma.student.create({
        data: {
          ...studentData,
          fullname:
            student.firstname +
            " " +
            (student.middlename ? student.middlename + " " : "") +
            student.lastname,
          batch: {
            connect: { id: batchId },
          },
        },
      });

      return newStudent;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Preview CSV data before importing
   */
  public async previewCSV(
    fileContent: string,
    batchId: number
  ): Promise<CSVPreviewData> {
    try {
      // Validate batch exists
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        throw new Error(`Batch with ID ${batchId} not found`);
      }

      const { rows, errors } = parseCSV(fileContent);

      // Check for duplicate emails in database
      const emailsInDB = await prisma.student.findMany({
        where: {
          email: { in: rows.map((r) => r.email.toLowerCase()) },
        },
        select: { email: true },
      });

      const existingEmails = new Set(emailsInDB.map((s) => s.email.toLowerCase()));

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

        if (existingEmails.has(email)) {
          errors.push({
            row: index + 2,
            email: row.email,
            error: "Email already exists in database",
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Import students from CSV
   */
  public async enrollCSV(
    fileContent: string,
    batchId: number
  ): Promise<CSVImportResult> {
    try {
      // Validate batch exists
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        throw new Error(`Batch with ID ${batchId} not found`);
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

      // Get existing emails to check for duplicates
      const emailsInDB = await prisma.student.findMany({
        where: {
          email: { in: rows.map((r) => r.email.toLowerCase()) },
        },
        select: { email: true },
      });

      const existingEmails = new Set(emailsInDB.map((s) => s.email.toLowerCase()));

      // Track emails being imported to catch duplicates in CSV
      const importedEmails = new Set<string>();
      const imported: any[] = [];
      const importErrors: CSVImportError[] = [...errors];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const email = row.email.toLowerCase();

        // Skip if email already exists or was already imported
        if (existingEmails.has(email)) {
          importErrors.push({
            row: i + 2,
            email: row.email,
            error: "Email already exists in database",
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
          const student = await prisma.student.create({
            data: {
              firstname: row.firstname.trim(),
              middlename: row.middlename?.trim() || "",
              lastname: row.lastname.trim(),
              fullname:
                row.firstname.trim() +
                " " +
                (row.middlename ? row.middlename.trim() + " " : "") +
                row.lastname.trim(),
              email: email,
              dob: normalizeDateFormat(row.dob),
              address: row.address?.trim() || "",
              batch: {
                connect: { id: batchId },
              },
            },
          });

          importedEmails.add(email);
          imported.push(student);
        } catch (error: any) {
          importErrors.push({
            row: i + 2,
            email: row.email,
            error: error.message || "Failed to create student",
          });
        }
      }

      return {
        total: rows.length,
        successful: imported.length,
        failed: importErrors.length,
        errors: importErrors,
        imported,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all students (optionally filtered by batch)
   */
  public async getAll(batchId?: number): Promise<Student[]> {
    try {
      if (batchId) {
        const batch = await prisma.batch.findUnique({
          where: { id: batchId },
        });

        if (!batch) {
          throw new Error("Batch not found");
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
        batchId: true,
        createdAt: true,
        updatedAt: true,
      };

      const where: Prisma.StudentWhereInput = {
        isDeleted: false,
      };

      if (batchId) {
        where.batchId = batchId;
      }

      const students = await prisma.student.findMany({
        where,
        select,
        orderBy: { createdAt: "desc" },
      });

      return students;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single student by ID
   */
  public async getById(id: number): Promise<Student> {
    try {
      const student = await prisma.student.findUnique({
        where: { id, isDeleted: false },
        include: {
          batch: {
            select: { id: true, name: true },
          },
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      return student;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a student
   */
  public async update(
    id: number,
    data: Partial<EnrollStudentInput>
  ): Promise<Student> {
    try {
      const student = await this.getById(id);

      // If updating email, check for duplicates
      if (data.email && data.email !== student.email) {
        const existing = await prisma.student.findUnique({
          where: { email: data.email },
        });

        if (existing) {
          throw new Error("Email already in use by another student");
        }
      }

      // If updating batch, validate it exists
      if (data.batchId) {
        const batch = await prisma.batch.findUnique({
          where: { id: data.batchId },
        });

        if (!batch) {
          throw new Error(`Batch with ID ${data.batchId} not found`);
        }
      }

      // Rebuild fullname if name parts are updated
      let fullname = student.fullname;
      if (data.firstname || data.middlename !== undefined || data.lastname) {
        const firstname = data.firstname || student.firstname;
        const middlename =
          data.middlename !== undefined ? data.middlename : student.middlename;
        const lastname = data.lastname || student.lastname;
        fullname = `${firstname} ${middlename ? middlename + " " : ""}${lastname}`;
      }

      const { batchId, ...updateData } = data;

      const updated = await prisma.student.update({
        where: { id },
        data: {
          ...updateData,
          fullname,
          ...(batchId && { batch: { connect: { id: batchId } } }),
        },
      });

      return updated;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete (soft) a student
   */
  public async delete(id: number, deletedBy: string): Promise<void> {
    try {
      await this.getById(id); // Verify exists

      await prisma.student.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedBy,
        },
      });
    } catch (error) {
      throw error;
    }
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
    try {
      const student = await prisma.student.findUnique({
        where: { email: email.toLowerCase(), isDeleted: false },
        include: {
          batch: {
            select: { id: true, name: true },
          },
        },
      });

      return student;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all soft-deleted students
   */
  public async getDeleted(): Promise<Student[]> {
    try {
      const students = await prisma.student.findMany({
        where: { isDeleted: true },
        include: {
          batch: {
            select: { id: true, name: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return students;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restore soft-deleted students
   */
  public async restore(ids: number[]): Promise<{ restored: number }> {
    try {
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

      return { restored: result.count };
    } catch (error) {
      throw error;
    }
  }

  // =====================
  // DANGER ZONE - HARD DELETE OPERATIONS
  // =====================

  /**
   * Permanently delete a student (DANGER: This cannot be undone!)
   */
  public async hardDelete(id: number): Promise<void> {
    try {
      // First delete related attendance records
      await prisma.attendance.deleteMany({
        where: { studentId: id },
      });

      // Then delete the student
      await prisma.student.delete({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Permanently delete multiple students (DANGER: This cannot be undone!)
   */
  public async hardDeleteMany(ids: number[]): Promise<{ deleted: number }> {
    try {
      // First delete related attendance records
      await prisma.attendance.deleteMany({
        where: { studentId: { in: ids } },
      });

      // Then delete the students
      const result = await prisma.student.deleteMany({
        where: { id: { in: ids } },
      });

      return { deleted: result.count };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Permanently delete all soft-deleted students (DANGER: This cannot be undone!)
   */
  public async purgeDeleted(): Promise<{ deleted: number }> {
    try {
      const deletedStudents = await prisma.student.findMany({
        where: { isDeleted: true },
        select: { id: true },
      });

      const ids = deletedStudents.map((s) => s.id);

      if (ids.length === 0) {
        return { deleted: 0 };
      }

      // First delete related attendance records
      await prisma.attendance.deleteMany({
        where: { studentId: { in: ids } },
      });

      // Then delete the students
      const result = await prisma.student.deleteMany({
        where: { id: { in: ids } },
      });

      return { deleted: result.count };
    } catch (error) {
      throw error;
    }
  }
}
