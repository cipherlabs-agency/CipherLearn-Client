import joi from "joi";

const create = joi.object({
  title: joi.string().min(2).max(200).required(),
  subject: joi.string().min(1).max(100).required(),
  description: joi.string().max(500).optional().allow("", null),
  room: joi.string().max(50).optional().allow("", null),
  batchId: joi.number().integer().positive().required(),
  teacherId: joi.number().integer().positive().optional().allow(null),
  autoAssign: joi.boolean().optional().default(false),
  date: joi.string().isoDate().required(),
  startTime: joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
    .messages({ "string.pattern.base": "startTime must be in HH:mm format" }),
  endTime: joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
    .messages({ "string.pattern.base": "endTime must be in HH:mm format" }),
});

const createBulk = joi.object({
  title: joi.string().min(2).max(200).required(),
  subject: joi.string().min(1).max(100).required(),
  description: joi.string().max(500).optional().allow("", null),
  room: joi.string().max(50).optional().allow("", null),
  batchId: joi.number().integer().positive().required(),
  teacherId: joi.number().integer().positive().optional().allow(null),
  startTime: joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  endTime: joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  recurrence: joi.object({
    days: joi.array().items(
      joi.string().valid("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY")
    ).min(1).required(),
    startDate: joi.string().isoDate().required(),
    endDate: joi.string().isoDate().required(),
  }).required(),
});

const update = joi.object({
  title: joi.string().min(2).max(200).optional(),
  subject: joi.string().min(1).max(100).optional(),
  description: joi.string().max(500).optional().allow("", null),
  room: joi.string().max(50).optional().allow("", null),
  batchId: joi.number().integer().positive().optional(),
  date: joi.string().isoDate().optional(),
  startTime: joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

const assign = joi.object({
  teacherId: joi.number().integer().positive().required(),
});

const updateStatus = joi.object({
  status: joi.string().valid("SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED").required(),
  notes: joi.string().max(1000).optional().allow("", null),
});

const list = joi.object({
  batchId: joi.number().integer().positive().optional(),
  teacherId: joi.number().integer().positive().optional(),
  status: joi.string().valid("SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED").optional(),
  startDate: joi.string().isoDate().optional(),
  endDate: joi.string().isoDate().optional(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

export const LectureValidations = {
  create,
  createBulk,
  update,
  assign,
  updateStatus,
  list,
};
