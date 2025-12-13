import Joi from "joi";

const note = Joi.object({
  title: Joi.string().required(),
});

export const NotesValidations = {
  notes: note,
};
