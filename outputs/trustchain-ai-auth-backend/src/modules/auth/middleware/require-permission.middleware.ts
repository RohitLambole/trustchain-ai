import type { RequestHandler } from "express";
import { ForbiddenError, UnauthorizedError } from "../../../shared/errors/app-error";

export function requirePermission(permissionCode: string): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(new UnauthorizedError());
    }

    if (!req.auth.permissions.includes(permissionCode) && !req.auth.permissions.includes("*:*")) {
      return next(new ForbiddenError(`Missing permission: ${permissionCode}`));
    }

    next();
  };
}
