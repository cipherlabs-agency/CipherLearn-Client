import Joi from "joi";

const list = Joi.object({
  batchId: Joi.number().integer().positive().optional(),
  category: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const StudyMaterialValidations = {
  list,
};
