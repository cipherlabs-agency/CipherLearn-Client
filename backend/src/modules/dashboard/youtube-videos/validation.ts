import Joi from "joi";
import { YoutubeVideoVisibility } from "../../../../prisma/generated/prisma/enums";

const upload = Joi.object({
  title: Joi.string().max(150).required(),
  description: Joi.string().optional(),
  category: Joi.string().optional(),
  visibility: Joi.string()
    .valid(
      YoutubeVideoVisibility.PRIVATE,
      YoutubeVideoVisibility.PUBLIC,
      YoutubeVideoVisibility.UNLISTED
    )
    .default(YoutubeVideoVisibility.PRIVATE),
  url: Joi.string().uri().required(),
  batchId: Joi.number().required(),
});

const update = Joi.object({
  title: Joi.string().max(150).optional(),
  description: Joi.string().optional(),
  category: Joi.string().optional(),
  visibility: Joi.string()
    .valid(
      YoutubeVideoVisibility.PRIVATE,
      YoutubeVideoVisibility.PUBLIC,
      YoutubeVideoVisibility.UNLISTED
    )
    .optional(),
  url: Joi.string().uri().optional(),
  batchId: Joi.number().optional(),
});

const getQuery = Joi.object({
  batchId: Joi.number().optional(),
  category: Joi.string().optional(),
  visibility: Joi.string()
    .valid(
      YoutubeVideoVisibility.PRIVATE,
      YoutubeVideoVisibility.PUBLIC,
      YoutubeVideoVisibility.UNLISTED
    )
    .optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  search: Joi.string().optional(),
});

const batchQuery = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});

export const YoutubeVideoValidations = {
  upload,
  update,
  getQuery,
  batchQuery,
};
