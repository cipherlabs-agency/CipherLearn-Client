import Joi from "joi";

const authenticate = Joi.object({
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

const seed = Joi.object({
  password: Joi.string().required(),
  count: Joi.number().integer().min(1).max(500).default(10),
  batchId: Joi.number().integer().positive().optional(),
});

const testNotification = Joi.object({
  userId: Joi.number().integer().positive().required(),
  title: Joi.string().trim().max(100).optional(),
  message: Joi.string().trim().max(500).optional(),
});

const loadTest = Joi.object({
  endpoint: Joi.string().uri().required(),
  concurrency: Joi.number().integer().min(1).max(50).default(5),
  requests: Joi.number().integer().min(1).max(200).default(20),
});

export const MaintenanceValidations = {
  authenticate,
  seed,
  testNotification,
  loadTest,
};
