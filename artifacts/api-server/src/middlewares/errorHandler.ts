import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error({ err, method: req.method, url: req.url }, "Unhandled error");

  if (res.headersSent) return;

  res.status(500).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
}
