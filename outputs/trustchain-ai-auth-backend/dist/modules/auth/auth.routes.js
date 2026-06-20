"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const validate_middleware_1 = require("../../shared/middleware/validate.middleware");
const auth_controller_1 = require("./controllers/auth.controller");
const auth_dto_1 = require("./dto/auth.dto");
const authenticate_middleware_1 = require("./middleware/authenticate.middleware");
const controller = new auth_controller_1.AuthController();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false
});
const passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false
});
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/register", authLimiter, (0, validate_middleware_1.validateBody)(auth_dto_1.RegisterDtoSchema), controller.register);
exports.authRouter.post("/login", authLimiter, (0, validate_middleware_1.validateBody)(auth_dto_1.LoginDtoSchema), controller.login);
exports.authRouter.post("/refresh", authLimiter, (0, validate_middleware_1.validateBody)(auth_dto_1.RefreshTokenDtoSchema), controller.refresh);
exports.authRouter.post("/totp/enroll", authenticate_middleware_1.authenticate, controller.enrollTotp);
exports.authRouter.post("/totp/verify", authenticate_middleware_1.authenticate, (0, validate_middleware_1.validateBody)(auth_dto_1.TotpVerifyDtoSchema), controller.verifyTotp);
exports.authRouter.post("/logout", authenticate_middleware_1.authenticate, (0, validate_middleware_1.validateBody)(auth_dto_1.LogoutDtoSchema), controller.logout);
exports.authRouter.post("/password-reset/request", passwordResetLimiter, (0, validate_middleware_1.validateBody)(auth_dto_1.PasswordResetRequestDtoSchema), controller.requestPasswordReset);
exports.authRouter.post("/password-reset/confirm", passwordResetLimiter, (0, validate_middleware_1.validateBody)(auth_dto_1.PasswordResetConfirmDtoSchema), controller.confirmPasswordReset);
