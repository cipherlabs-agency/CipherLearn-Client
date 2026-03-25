import Joi from "joi";

const slotsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  batchId: Joi.number().integer().positive().optional(),
  includeExpired: Joi.boolean().default(true),
});

const submissionsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  slotId: Joi.number().integer().positive().optional(),
  studentId: Joi.number().integer().positive().optional(),
  status: Joi.string().valid("PENDING", "ACCEPTED", "REJECTED").optional(),
});

export const AssignmentValidations = { slotsQuery, submissionsQuery };
