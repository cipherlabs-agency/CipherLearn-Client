import joi from "joi";

const enroll = joi.object({
  email: joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
  }),
  firstname: joi.string().min(1).max(50).required().messages({
    "any.required": "First name is required",
    "string.empty": "First name cannot be empty",
    "string.min": "First name must be at least 1 character",
    "string.max": "First name cannot exceed 50 characters",
  }),
  lastname: joi.string().min(1).max(50).required().messages({
    "any.required": "Last name is required",
    "string.empty": "Last name cannot be empty",
    "string.min": "Last name must be at least 1 character",
    "string.max": "Last name cannot exceed 50 characters",
  }),
  middlename: joi.string().allow(null, "").max(50).optional().messages({
    "string.max": "Middle name cannot exceed 50 characters",
  }),
  dob: joi.string().required().messages({
    "any.required": "Date of birth is required",
    "string.empty": "Date of birth cannot be empty",
  }),
  address: joi.string().min(5).max(500).required().messages({
    "any.required": "Address is required",
    "string.empty": "Address cannot be empty",
    "string.min": "Address must be at least 5 characters",
    "string.max": "Address cannot exceed 500 characters",
  }),
  batchId: joi.number().integer().positive().required().messages({
    "any.required": "Batch ID is required",
    "number.base": "Batch ID must be a number",
    "number.integer": "Batch ID must be an integer",
    "number.positive": "Batch ID must be a positive number",
  }),
  phone: joi.string().allow(null, "").max(20).optional().messages({
    "string.max": "Phone cannot exceed 20 characters",
  }),
  parentName: joi.string().allow(null, "").max(100).optional().messages({
    "string.max": "Parent name cannot exceed 100 characters",
  }),
  grade: joi.string().allow(null, "").max(20).optional().messages({
    "string.max": "Grade cannot exceed 20 characters",
  }),
  instituteId: joi.string().allow(null, "").max(50).optional().messages({
    "string.max": "Institute ID cannot exceed 50 characters",
  }),
});

const update = joi.object({
  email: joi.string().email().optional().messages({
    "string.email": "Please provide a valid email address",
  }),
  firstname: joi.string().min(1).max(50).optional().messages({
    "string.min": "First name must be at least 1 character",
    "string.max": "First name cannot exceed 50 characters",
  }),
  lastname: joi.string().min(1).max(50).optional().messages({
    "string.min": "Last name must be at least 1 character",
    "string.max": "Last name cannot exceed 50 characters",
  }),
  middlename: joi.string().allow(null, "").max(50).optional().messages({
    "string.max": "Middle name cannot exceed 50 characters",
  }),
  dob: joi.string().optional(),
  address: joi.string().min(5).max(500).optional().messages({
    "string.min": "Address must be at least 5 characters",
    "string.max": "Address cannot exceed 500 characters",
  }),
  batchId: joi.number().integer().positive().optional().messages({
    "number.base": "Batch ID must be a number",
    "number.integer": "Batch ID must be an integer",
    "number.positive": "Batch ID must be a positive number",
  }),
  phone: joi.string().allow(null, "").max(20).optional().messages({
    "string.max": "Phone cannot exceed 20 characters",
  }),
  parentName: joi.string().allow(null, "").max(100).optional().messages({
    "string.max": "Parent name cannot exceed 100 characters",
  }),
  grade: joi.string().allow(null, "").max(20).optional().messages({
    "string.max": "Grade cannot exceed 20 characters",
  }),
  instituteId: joi.string().allow(null, "").max(50).optional().messages({
    "string.max": "Institute ID cannot exceed 50 characters",
  }),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});

const restore = joi.object({
  ids: joi.array().items(joi.number().integer().positive()).min(1).required().messages({
    "any.required": "IDs array is required",
    "array.min": "At least one ID must be provided",
    "number.base": "Each ID must be a number",
  }),
});

const hardDeleteMany = joi.object({
  ids: joi.array().items(joi.number().integer().positive()).min(1).required().messages({
    "any.required": "IDs array is required",
    "array.min": "At least one ID must be provided",
    "number.base": "Each ID must be a number",
  }),
});

const csvPreview = joi.object({
  batchId: joi.number().integer().positive().required().messages({
    "any.required": "Batch ID is required",
    "number.base": "Batch ID must be a number",
  }),
});

export const StudentValidations = {
  enroll,
  update,
  restore,
  hardDeleteMany,
  csvPreview,
};
