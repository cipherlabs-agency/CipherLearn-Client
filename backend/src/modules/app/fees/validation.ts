import Joi from "joi";

const recordPayment = Joi.object({
  paidAmount: Joi.number().positive().required().messages({
    "any.required": "Paid amount is required",
    "number.positive": "Paid amount must be positive",
  }),
  paymentMode: Joi.string()
    .valid("CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "ONLINE")
    .required()
    .messages({
      "any.required": "Payment mode is required",
      "any.only": "Invalid payment mode",
    }),
  transactionId: Joi.string().trim().max(100).optional().allow("", null),
  chequeNumber: Joi.string().trim().max(50).optional().allow("", null),
  bankName: Joi.string().trim().max(100).optional().allow("", null),
  notes: Joi.string().trim().max(500).optional().allow("", null),
});

const receiptsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  status: Joi.string().valid("PAID", "PARTIAL", "PENDING", "OVERDUE").optional(),
  year: Joi.number().integer().min(2020).max(2100).optional(),
  month: Joi.number().integer().min(1).max(12).optional(),
});

export const FeesValidations = { recordPayment, receiptsQuery };
