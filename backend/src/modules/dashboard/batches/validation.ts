import Joi from "joi";

const batch = Joi.object({
  name: Joi.string().required(),
  timings: Joi.object().optional(),
  totalStudents: Joi.object().optional(),
});

export const BatchValidations = {
  batch: batch,
};
