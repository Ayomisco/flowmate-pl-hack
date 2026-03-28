import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/env";
import logger from "../config/logger";

export interface AuthRequest extends Request {
  userId?: string;
  user?: { id: string; email: string };
}

/**
 * JWT Authentication Middleware
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn("Missing token", { path: req.path });
    res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    logger.warn("Invalid token", { path: req.path, error: (err as Error).message });
    res.status(403).json({ error: "Forbidden", message: "Invalid or expired token" });
  }
};

/**
 * Optional Authentication Middleware
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string };
      req.userId = decoded.userId;
      req.user = { id: decoded.userId, email: decoded.email };
    } catch (err) {
      logger.debug("Optional auth token validation failed", { error: (err as Error).message });
    }
  }

  next();
};
