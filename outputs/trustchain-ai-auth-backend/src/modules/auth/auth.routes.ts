import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateBody } from "../../shared/middleware/validate.middleware";
import { AuthController } from "./controllers/auth.controller";
import {
  LoginDtoSchema,
  LogoutDtoSchema,
  PasswordResetConfirmDtoSchema,
  PasswordResetRequestDtoSchema,
  RefreshTokenDtoSchema,
  RegisterDtoSchema,
  TotpVerifyDtoSchema
} from "./dto/auth.dto";
import { authenticate } from "./middleware/authenticate.middleware";

const controller = new AuthController();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false
});

export const authRouter = Router();

authRouter.post("/register", authLimiter, validateBody(RegisterDtoSchema), controller.register);
authRouter.post("/login", authLimiter, validateBody(LoginDtoSchema), controller.login);
authRouter.post("/refresh", authLimiter, validateBody(RefreshTokenDtoSchema), controller.refresh);
authRouter.post("/totp/enroll", authenticate, controller.enrollTotp);
authRouter.post("/totp/verify", authenticate, validateBody(TotpVerifyDtoSchema), controller.verifyTotp);
authRouter.post("/logout", authenticate, validateBody(LogoutDtoSchema), controller.logout);
authRouter.post("/password-reset/request", passwordResetLimiter, validateBody(PasswordResetRequestDtoSchema), controller.requestPasswordReset);
authRouter.post("/password-reset/confirm", passwordResetLimiter, validateBody(PasswordResetConfirmDtoSchema), controller.confirmPasswordReset);
