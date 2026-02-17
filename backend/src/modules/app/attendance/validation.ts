import Joi from "joi";
import { AttendanceStatus } from "../../../../prisma/generated/prisma/enums";

const historyQuery = Joi.object({
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2000).optional(),
  status: Joi.string()
    .valid(...Object.values(AttendanceStatus))
    .optional(),
});

const calendarQuery = Joi.object({
  month: Joi.number().integer().min(1).max(12).required().messages({
    "any.required": "Month is required",
    "number.min": "Month must be between 1 and 12",
    "number.max": "Month must be between 1 and 12",
  }),
  year: Joi.number().integer().min(2000).required().messages({
    "any.required": "Year is required",
    "number.min": "Year must be 2000 or later",
  }),
});

export const AppAttendanceValidations = {
  historyQuery,
  calendarQuery,
};
