import joi from "joi";

const create = joi.object({
  name: joi.string().min(2).max(100).required(),
  email: joi.string().email().required(),
});

const update = joi.object({
  name: joi.string().min(2).max(100).optional(),
  email: joi.string().email().optional(),
});

const list = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  search: joi.string().max(100).optional(),
});

export const TeacherValidations = {
  create,
  update,
  list,
};
