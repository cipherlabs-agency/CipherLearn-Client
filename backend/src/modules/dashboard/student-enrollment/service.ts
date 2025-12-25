import { Prisma, Student } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import { StudentCSV, EnrollStudentInput } from "./types";

export default class StudentEnrollmentService {
  public async enrollSingle(student: EnrollStudentInput): Promise<Student> {
    try {
      let alreadyExist = await prisma.student.findUnique({
        where: { email: student.email },
      });

      if (alreadyExist)
        throw new Error("Student with this email already exist");

      const { batchId, ...studentData } = student;

      const newStudent = await prisma.student.create({
        data: {
          ...studentData,
          fullname:
            student.firstname +
            " " +
            student.middlename +
            " " +
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
  public async enrollCSV(csv: StudentCSV) {}

  public async getAll(batchId: number): Promise<Student[]> {
    try {
      let batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) throw new Error("Batch not found");

      let select: Prisma.StudentSelect = {
        id: true,
        firstname: true,
        middlename: true,
        lastname: true,
        fullname: true,
        email: true,
        dob: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      };

      const students = await prisma.student.findMany({
        select,
      });
      return students;
    } catch (error) {
      throw error;
    }
  }
}
