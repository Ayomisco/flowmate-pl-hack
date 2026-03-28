import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

/**
 * Request validation middleware
 */
export const validateRequest = (
  requiredFields: string[]
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter(
      (field) => !req.body[field] || (typeof req.body[field] === "string" && !req.body[field].trim())
    );

    if (missingFields.length > 0) {
      logger.warn("Validation error", { missingFields, path: req.path });
      res.status(400).json({
        error: "Validation Error",
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    next();
  };
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === "object") {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        // Basic XSS prevention
        req.body[key] = req.body[key]
          .replace(/[<>]/g, "")
          .trim();
      }
    });
  }

  next();
};
