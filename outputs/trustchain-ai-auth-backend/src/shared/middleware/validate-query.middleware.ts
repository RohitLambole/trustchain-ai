import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    try {
      req.query = schema.parse(req.query) as never;
      next();
    } catch (error) {
      next(error);
    }
  };
}
