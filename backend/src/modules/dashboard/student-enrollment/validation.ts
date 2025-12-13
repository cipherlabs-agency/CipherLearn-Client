import joi from "joi";

const enroll = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  batchId: joi.number().required(),
  firstname: joi.string().required(),
  lastname: joi.string().required(),
  middletname: joi.string().required(),
  dob: joi.date().required(),
  address: joi.string().required(),
});

export const StudentValidations = {
  enroll: enroll,
};
