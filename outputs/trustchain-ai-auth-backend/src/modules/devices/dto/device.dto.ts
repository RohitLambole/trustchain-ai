import { z } from "zod";

export const DeviceFingerprintDtoSchema = z.object({
  userAgent: z.string().min(1).max(1024).optional(),
  browser: z.string().max(128).optional(),
  os: z.string().max(128).optional(),
  screenResolution: z.string().regex(/^[0-9]{2,5}x[0-9]{2,5}$/).optional(),
  timezone: z.string().max(128).optional(),
  language: z.string().max(64).optional(),
  platform: z.string().max(128).optional(),
  ipAddress: z.string().max(128).optional()
});

export const RegisterDeviceDtoSchema = z.object({
  fingerprint: DeviceFingerprintDtoSchema
});

export const TrustDeviceDtoSchema = z.object({
  deviceId: z.string().regex(/^[0-9a-fA-F]{24}$/)
});

export const BlockDeviceDtoSchema = z.object({
  deviceId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  reason: z.string().min(3).max(500)
});

export type DeviceFingerprintDto = z.infer<typeof DeviceFingerprintDtoSchema>;
export type RegisterDeviceDto = z.infer<typeof RegisterDeviceDtoSchema>;
export type TrustDeviceDto = z.infer<typeof TrustDeviceDtoSchema>;
export type BlockDeviceDto = z.infer<typeof BlockDeviceDtoSchema>;
