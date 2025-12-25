import type { Request, Response } from "express";
import { Prisma } from "../../../../prisma/generated/prisma/client";
import StudentEnrollmentService from "./service";
import logger from "../../../utils/logger";
import { EnrollStudentInput } from "./types";

const studentEnrollmentService = new StudentEnrollmentService();

export default class StudentEnrollmentController {
  public async enrollSingle(req: Request, res: Response) {
    try {
      const {
        dob,
        email,
        firstname,
        fullname,
        lastname,
        middlename,
        address,
        batchId,
      }: EnrollStudentInput = req.body;

      if (
        !firstname ||
        !middlename ||
        !lastname ||
        !address ||
        !batchId ||
        !dob ||
        !email
      )
        return res
          .status(400)
          .json({ success: false, message: `All fields are required!` });
      const student = await studentEnrollmentService.enrollSingle({
        dob,
        email,
        firstname,
        fullname,
        lastname,
        middlename,
        address,
        batchId,
      });

      logger.info(`Student enrolled: ${student.email}`);

      return res
        .status(201)
        .json({ success: true, message: "Student enrolled", student });
    } catch (error) {
      logger.error("StudentEnrollment.enrollSingle error:", error);
      return res
        .status(500)
        .json({ success: false, message: `Enrollment failed : ${error}` });
    }
  }

  public async enrollCSV() {}

  public async getAll(req: Request, res: Response) {
    try {
      const batchId = Number(req.params.id);

      const students = await studentEnrollmentService.getAll(batchId);
      return res.status(200).json({ success: true, students });
    } catch (error) {
      logger.error("StudentEnrollment.getAll error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch students: ${error}`,
      });
    }
  }
}
