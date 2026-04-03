import Joi from "joi";

const FREQUENCIES = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"];

export const adminValidations = {
  createBatch: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    timings: Joi.any().optional(),
  }),

  updateBatch: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    timings: Joi.any().optional(),
  }).min(1),

  enrollStudent: Joi.object({
    email: Joi.string().email().required(),
    firstname: Joi.string().trim().min(1).max(60).required(),
    middlename: Joi.string().trim().max(60).allow("").default(""),
    lastname: Joi.string().trim().min(1).max(60).required(),
    dob: Joi.string().required(),
    batchId: Joi.number().integer().min(1).required(),
    address: Joi.string().trim().max(300).allow("").default(""),
    phone: Joi.string().trim().max(20).optional().allow("", null),
    parentName: Joi.string().trim().max(100).optional().allow("", null),
    grade: Joi.string().trim().max(20).optional().allow("", null),
    instituteId: Joi.string().trim().max(50).optional().allow("", null),
  }),

  updateStudent: Joi.object({
    firstname: Joi.string().trim().min(1).max(60).optional(),
    middlename: Joi.string().trim().max(60).optional().allow("", null),
    lastname: Joi.string().trim().min(1).max(60).optional(),
    dob: Joi.string().optional(),
    batchId: Joi.number().integer().min(1).optional(),
    address: Joi.string().trim().max(300).optional().allow("", null),
    phone: Joi.string().trim().max(20).optional().allow("", null),
    parentName: Joi.string().trim().max(100).optional().allow("", null),
    grade: Joi.string().trim().max(20).optional().allow("", null),
    instituteId: Joi.string().trim().max(50).optional().allow("", null),
  }).min(1),

  createTeacher: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().required(),
  }),

  updateTeacher: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
  }).min(1),

  createFeeStructure: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    amount: Joi.number().min(0).required(),
    frequency: Joi.string().valid(...FREQUENCIES).required(),
    batchId: Joi.number().integer().min(1).required(),
    dueDay: Joi.number().integer().min(1).max(31).optional(),
  }),

  updateFeeStructure: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    amount: Joi.number().min(0).optional(),
    frequency: Joi.string().valid(...FREQUENCIES).optional(),
    dueDay: Joi.number().integer().min(1).max(31).optional().allow(null),
    isActive: Joi.boolean().optional(),
  }).min(1),
};
