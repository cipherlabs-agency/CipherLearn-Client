import type { Request, Response } from "express";
import { Prisma } from "../../../../prisma/generated/prisma/client";
import StudentEnrollmentService from "./service";

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
      }: Prisma.StudentCreateInput = req.body;

      if (
        !firstname ||
        !middlename ||
        !lastname ||
        !fullname ||
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

      return res
        .status(201)
        .json({ success: true, message: "Student enrolled", student });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `Enrollment failed : ${error}` });
    }
  }

  public async enrollCSV() {}
}
