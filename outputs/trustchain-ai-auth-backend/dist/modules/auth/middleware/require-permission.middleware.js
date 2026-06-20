"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
const app_error_1 = require("../../../shared/errors/app-error");
function requirePermission(permissionCode) {
    return (req, _res, next) => {
        if (!req.auth) {
            return next(new app_error_1.UnauthorizedError());
        }
        if (!req.auth.permissions.includes(permissionCode) && !req.auth.permissions.includes("*:*")) {
            return next(new app_error_1.ForbiddenError(`Missing permission: ${permissionCode}`));
        }
        next();
    };
}
