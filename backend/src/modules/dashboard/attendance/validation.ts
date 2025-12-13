import Joi from "joi";

const Attendance = Joi.object({
  student: Joi.object().required(),
});

export const AttendanceValidations = {
  attendance: Attendance,
};
