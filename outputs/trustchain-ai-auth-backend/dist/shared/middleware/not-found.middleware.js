"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = void 0;
const app_error_1 = require("../errors/app-error");
const notFoundMiddleware = (req, _res, next) => {
    next(new app_error_1.NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};
exports.notFoundMiddleware = notFoundMiddleware;
