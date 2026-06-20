import { z } from "zod";
import { DeviceFingerprintDtoSchema } from "../../devices/dto/device.dto";

const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a symbol");

export const RegisterDtoSchema = z.object({
  email: z.string().email().toLowerCase(),
  phone: z.string().min(7).max(20).optional(),
  password: passwordSchema,
  customerId: z.string().min(2).max(64).optional(),
  employeeId: z.string().min(2).max(64).optional(),
  roleNames: z.array(z.string().min(1)).default(["CUSTOMER"])
});

export const LoginDtoSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  totpCode: z.string().regex(/^[0-9]{6}$/).optional(),
  device: DeviceFingerprintDtoSchema.optional()
});

export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(32)
});

export const TotpVerifyDtoSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/)
});

export const LogoutDtoSchema = z.object({
  refreshToken: z.string().min(32).optional(),
  allSessions: z.boolean().default(false)
});

export const PasswordResetRequestDtoSchema = z.object({
  email: z.string().email().toLowerCase()
});

export const PasswordResetConfirmDtoSchema = z.object({
  email: z.string().email().toLowerCase(),
  token: z.string().min(32),
  newPassword: passwordSchema
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
export type LoginDto = z.infer<typeof LoginDtoSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>;
export type TotpVerifyDto = z.infer<typeof TotpVerifyDtoSchema>;
export type LogoutDto = z.infer<typeof LogoutDtoSchema>;
export type PasswordResetRequestDto = z.infer<typeof PasswordResetRequestDtoSchema>;
export type PasswordResetConfirmDto = z.infer<typeof PasswordResetConfirmDtoSchema>;
