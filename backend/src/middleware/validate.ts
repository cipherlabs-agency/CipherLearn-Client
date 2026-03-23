import { Request, Response, NextFunction } from "express";
import Joi from "joi";

type ValidationTarget = "body" | "query" | "params";

/**
 * Generic request validation middleware factory.
 * Usage: validate(schema) — validates req.body by default
 *        validate(schema, "query") — validates req.query
 */
export const validate = (
  schema: Joi.ObjectSchema,
  target: ValidationTarget = "body"
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[target];
    const { error, value } = schema.validate(data, {
      abortEarly: false,   // Return all errors at once
      stripUnknown: true,  // Remove unknown keys silently
      convert: true,       // Type coercion (string "1" → number 1 for query params)
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
      return;
    }

    // Replace the target with the cleaned/coerced value
    (req as any)[target] = value;
    next();
  };
};
