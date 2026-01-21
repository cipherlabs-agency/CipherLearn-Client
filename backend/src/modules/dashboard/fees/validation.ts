import Joi from "joi";

// Enum values for validation
const paymentModes = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "ONLINE"];
const paymentStatuses = ["PAID", "PARTIAL", "PENDING", "OVERDUE"];
const feeFrequencies = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"];

// ============================================
// Fee Structure Validation Schemas
// ============================================

export const createFeeStructureSchema = Joi.object({
  batchId: Joi.number().integer().positive().required()
    .messages({
      "number.base": "Batch ID must be a number",
      "number.positive": "Batch ID must be a positive number",
      "any.required": "Batch ID is required",
    }),
  name: Joi.string().trim().min(2).max(100).required()
    .messages({
      "string.empty": "Fee structure name is required",
      "string.min": "Fee structure name must be at least 2 characters",
      "string.max": "Fee structure name must not exceed 100 characters",
    }),
  amount: Joi.number().positive().required()
    .messages({
      "number.base": "Amount must be a number",
      "number.positive": "Amount must be a positive number",
      "any.required": "Amount is required",
    }),
  frequency: Joi.string().valid(...feeFrequencies).default("MONTHLY"),
  dueDay: Joi.number().integer().min(1).max(28).default(5)
    .messages({
      "number.min": "Due day must be between 1 and 28",
      "number.max": "Due day must be between 1 and 28",
    }),
  lateFee: Joi.number().min(0).default(0),
  gracePeriod: Joi.number().integer().min(0).max(30).default(5),
  description: Joi.string().trim().max(500).allow("", null),
});

export const updateFeeStructureSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  amount: Joi.number().positive(),
  frequency: Joi.string().valid(...feeFrequencies),
  dueDay: Joi.number().integer().min(1).max(28),
  lateFee: Joi.number().min(0),
  gracePeriod: Joi.number().integer().min(0).max(30),
  isActive: Joi.boolean(),
  description: Joi.string().trim().max(500).allow("", null),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});

// ============================================
// Fee Receipt Validation Schemas
// ============================================

export const createFeeReceiptSchema = Joi.object({
  studentId: Joi.number().integer().positive().required()
    .messages({
      "any.required": "Student ID is required",
    }),
  batchId: Joi.number().integer().positive().required()
    .messages({
      "any.required": "Batch ID is required",
    }),
  feeStructureId: Joi.number().integer().positive().allow(null),
  totalAmount: Joi.number().positive().required()
    .messages({
      "any.required": "Total amount is required",
      "number.positive": "Total amount must be positive",
    }),
  paidAmount: Joi.number().min(0).default(0),
  discountAmount: Joi.number().min(0).default(0),
  lateFeeAmount: Joi.number().min(0).default(0),
  paymentMode: Joi.string().valid(...paymentModes).allow(null),
  transactionId: Joi.string().trim().max(100).allow("", null),
  chequeNumber: Joi.string().trim().max(50).allow("", null),
  bankName: Joi.string().trim().max(100).allow("", null),
  paymentNotes: Joi.string().trim().max(500).allow("", null),
  academicMonth: Joi.number().integer().min(1).max(12).required()
    .messages({
      "any.required": "Academic month is required",
      "number.min": "Academic month must be between 1 and 12",
      "number.max": "Academic month must be between 1 and 12",
    }),
  academicYear: Joi.number().integer().min(2020).max(2100).required()
    .messages({
      "any.required": "Academic year is required",
    }),
  dueDate: Joi.date().iso().required()
    .messages({
      "any.required": "Due date is required",
    }),
  paymentDate: Joi.date().iso().allow(null),
});

export const updateFeeReceiptSchema = Joi.object({
  paidAmount: Joi.number().min(0),
  discountAmount: Joi.number().min(0),
  lateFeeAmount: Joi.number().min(0),
  paymentMode: Joi.string().valid(...paymentModes).allow(null),
  transactionId: Joi.string().trim().max(100).allow("", null),
  chequeNumber: Joi.string().trim().max(50).allow("", null),
  bankName: Joi.string().trim().max(100).allow("", null),
  paymentNotes: Joi.string().trim().max(500).allow("", null),
  dueDate: Joi.date().iso(),
  paymentDate: Joi.date().iso().allow(null),
  status: Joi.string().valid(...paymentStatuses),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});

export const bulkCreateReceiptsSchema = Joi.object({
  batchId: Joi.number().integer().positive().required()
    .messages({
      "any.required": "Batch ID is required",
    }),
  feeStructureId: Joi.number().integer().positive().allow(null),
  academicMonth: Joi.number().integer().min(1).max(12).required()
    .messages({
      "any.required": "Academic month is required",
    }),
  academicYear: Joi.number().integer().min(2020).max(2100).required()
    .messages({
      "any.required": "Academic year is required",
    }),
  dueDate: Joi.date().iso().required()
    .messages({
      "any.required": "Due date is required",
    }),
  studentIds: Joi.array().items(Joi.number().integer().positive()).allow(null),
});

// ============================================
// Filter Validation Schemas
// ============================================

export const feeReceiptFiltersSchema = Joi.object({
  batchId: Joi.number().integer().positive(),
  studentId: Joi.number().integer().positive(),
  status: Joi.string().valid(...paymentStatuses),
  academicMonth: Joi.number().integer().min(1).max(12),
  academicYear: Joi.number().integer().min(2020).max(2100),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")),
  paymentMode: Joi.string().valid(...paymentModes),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// ============================================
// Helper function for validation
// ============================================

export function validate<T>(schema: Joi.ObjectSchema, data: unknown): { value: T; error?: string } {
  const { value, error } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map((detail) => detail.message).join("; ");
    return { value: value as T, error: messages };
  }

  return { value: value as T };
}
