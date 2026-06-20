import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, ValidationError } from "../errors/app-error";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const normalized = error instanceof ZodError ? new ValidationError(error.flatten()) : error;

  if (normalized instanceof AppError) {
    return res.status(normalized.statusCode).json({
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details
      }
    });
  }

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error"
    }
  });
};
