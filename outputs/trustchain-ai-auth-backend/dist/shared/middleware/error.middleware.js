"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const zod_1 = require("zod");
const app_error_1 = require("../errors/app-error");
const errorMiddleware = (error, _req, res, _next) => {
    const normalized = error instanceof zod_1.ZodError ? new app_error_1.ValidationError(error.flatten()) : error;
    if (normalized instanceof app_error_1.AppError) {
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
exports.errorMiddleware = errorMiddleware;
