import Joi from "joi";
import {
  AttendanceMethod,
  AttendanceStatus,
} from "../../../../prisma/generated/prisma/enums";

const createAttendanceSheet = Joi.object({
  batchId: Joi.number().required(),
  month: Joi.number().min(1).max(12).required(),
  year: Joi.number().min(2000).required(),
  attendance: Joi.array()
    .items(
      Joi.object({
        studentId: Joi.number().required(),
        status: Joi.string().valid(...Object.values(AttendanceStatus)).required(),
        batchId: Joi.number().required(),
        date: Joi.date().required(),
        markedBy: Joi.string().required(),
        markedById: Joi.number().required(),
        method: Joi.string().valid(...Object.values(AttendanceMethod)).required(),
      })
    )
    .optional(),
});

const markAttendance = Joi.object({
  studentId: Joi.number().required(),
  batchId: Joi.number().required(),
  date: Joi.date().required(),
  markedBy: Joi.string().required(),
  markedById: Joi.number().required(),
  method: Joi.string().valid(...Object.values(AttendanceMethod)).required(),
  status: Joi.string().valid(...Object.values(AttendanceStatus)).required(),
});

const markBulkAttendance = Joi.object({
  batchId: Joi.number().required(),
  date: Joi.string().required(),
  attendances: Joi.array()
    .items(
      Joi.object({
        studentId: Joi.number().required(),
        status: Joi.string().valid(...Object.values(AttendanceStatus)).required(),
      })
    )
    .min(1)
    .required(),
});

const updateAttendance = Joi.object({
  status: Joi.string().valid(...Object.values(AttendanceStatus)).required(),
});

const markQRAttendance = Joi.object({
  studentId: Joi.number().required(),
  qrData: Joi.string().required(),
});

const reportQuery = Joi.object({
  startDate: Joi.string().required(),
  endDate: Joi.string().required(),
});

export const AttendanceValidations = {
  attendanceSheet: {
    create: createAttendanceSheet,
  },
  attendance: {
    mark: markAttendance,
    markBulk: markBulkAttendance,
    update: updateAttendance,
  },
  qr: {
    mark: markQRAttendance,
  },
  report: {
    query: reportQuery,
  },
};
