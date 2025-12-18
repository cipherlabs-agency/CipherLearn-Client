import Joi from "joi";

const upload = Joi.object({
  title: Joi.string().required(),
  content: Joi.array().items(Joi.object()).required(),
  batchId: Joi.number().required(),
});

export const NotesValidations = {
  upload: upload,
};
