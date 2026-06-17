import Joi from "joi";

const createLead = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "any.required": "Name is required",
    "string.min": "Name must be at least 2 characters",
  }),
  email: Joi.string().email().trim().lowercase().max(255).required().messages({
    "any.required": "Email is required",
    "string.email": "A valid email address is required",
  }),
  phone: Joi.string().trim().min(6).max(20).optional().allow("", null),
  batchId: Joi.number().integer().positive().required().messages({
    "any.required": "Batch is required",
  }),
  message: Joi.string().trim().max(1000).optional().allow("", null),
});

const getAllLeadsQuery = Joi.object({
  batchId: Joi.number().integer().positive().optional(),
  status: Joi.string().valid("NEW", "CONTACTED", "CONVERTED", "REJECTED").optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

export const CRMValidations = {
  createLead,
  getAllLeadsQuery,
};
