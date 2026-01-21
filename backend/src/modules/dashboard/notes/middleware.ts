import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";

// Extend Express Request to include validated data
declare global {
  namespace Express {
    interface Request {
      validatedQuery?: Record<string, unknown>;
      validatedParams?: Record<string, unknown>;
      validatedBody?: Record<string, unknown>;
    }
  }
}

/**
 * Middleware to validate request data using Joi schemas
 * @param schema - Joi validation schema
 * @param source - Source of data to validate (body, query, params)
 */
export const validateRequest = (
  schema: ObjectSchema,
  source: "body" | "query" | "params" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
      return;
    }

    // Store validated data in custom properties instead of overwriting read-only properties
    // Express 5 makes req.query, req.params read-only, so we use custom properties
    if (source === "query") {
      req.validatedQuery = value;
    } else if (source === "params") {
      req.validatedParams = value;
    } else if (source === "body") {
      // req.body is still writable in Express 5
      req.body = value;
      req.validatedBody = value;
    }
    next();
  };
};

/**
 * Middleware to handle multer errors
 */
export const handleMulterError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err) {
    // Multer errors
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        message: "File size exceeds the limit of 10MB per file",
      });
      return;
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      res.status(400).json({
        success: false,
        message: "Maximum 5 files allowed per upload",
      });
      return;
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      res.status(400).json({
        success: false,
        message: "Unexpected file field",
      });
      return;
    }

    // Custom file validation errors
    if (err.message.includes("Invalid file type")) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
      return;
    }

    if (err.message.includes("Invalid MIME type")) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
      return;
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: err.message || "File upload error",
    });
    return;
  }

  next();
};

/**
 * Middleware to check if files are provided
 */
export const requireFiles = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({
      success: false,
      message: "At least one file is required",
    });
    return;
  }

  next();
};

/**
 * Middleware to log file upload details
 */
export const logFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const files = req.files as Express.Multer.File[];

  if (files && files.length > 0) {
    console.log(`[File Upload] User uploaded ${files.length} files:`);
    files.forEach((file, index) => {
      console.log(
        `  ${index + 1}. ${file.originalname} (${file.mimetype}, ${(
          file.size / 1024
        ).toFixed(2)} KB)`
      );
    });
  }

  next();
};
