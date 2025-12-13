import Joi from "joi";

const youtubevideo = Joi.object({
  title: Joi.string().max(150).required(),
  description: Joi.string().required(),
});

export const YoutubeVideoValidations = {
  youtubevideo: youtubevideo,
};
