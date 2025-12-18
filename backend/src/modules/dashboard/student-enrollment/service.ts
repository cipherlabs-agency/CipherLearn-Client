import { Prisma, Student } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import { StudentCSV } from "./types";

export default class StudentEnrollmentService {
  public async enrollSingle(
    student: Prisma.StudentCreateInput
  ): Promise<Student> {
    try {
      let alreadyExist = await prisma.student.findUnique({
        where: { email: student.email },
      });

      if (alreadyExist)
        throw new Error("Student with this email already exist");

      const newStudent = await prisma.student.create({
        data: {
          ...student,
          fullname:
            student.firstname +
            " " +
            student.middlename +
            " " +
            student.lastname,
        },
      });

      return newStudent;
    } catch (error) {
      throw error;
    }
  }
  public async enrollCSV(csv: StudentCSV) {}

  public async getAll(): Promise<Student[]> {
    try {
      const students = await prisma.student.findMany();
      return students;
    } catch (error) {
      throw error;
    }
  }
}
