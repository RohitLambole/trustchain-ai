import { sha256 } from "../../../shared/security/crypto.service";
import type { DeviceFingerprint, DeviceFingerprintInput } from "../domain/device.types";

export class DeviceFingerprintService {
  create(input: Partial<DeviceFingerprintInput>): DeviceFingerprint {
    const userAgent = input.userAgent?.trim() || "unknown";
    const browser = this.normalize(input.browser || this.detectBrowser(userAgent));
    const os = this.normalize(input.os || this.detectOs(userAgent));
    const components = {
      userAgent: this.normalize(userAgent),
      browser,
      os,
      screenResolution: this.normalize(input.screenResolution || "unknown"),
      timezone: this.normalize(input.timezone || "unknown"),
      language: this.normalize(input.language || "unknown"),
      platform: this.normalize(input.platform || "unknown"),
      ipAddress: this.normalize(input.ipAddress || "unknown")
    };

    const stablePayload = [
      components.userAgent,
      components.browser,
      components.os,
      components.screenResolution,
      components.timezone,
      components.language,
      components.platform
    ].join("|");

    return {
      fingerprintHash: `sha256:${sha256(stablePayload)}`,
      browser,
      os,
      components
    };
  }

  private normalize(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
  }

  private detectBrowser(userAgent: string) {
    const ua = userAgent.toLowerCase();
    if (ua.includes("edg/")) return "edge";
    if (ua.includes("chrome/")) return "chrome";
    if (ua.includes("safari/") && !ua.includes("chrome/")) return "safari";
    if (ua.includes("firefox/")) return "firefox";
    return "unknown";
  }

  private detectOs(userAgent: string) {
    const ua = userAgent.toLowerCase();
    if (ua.includes("windows")) return "windows";
    if (ua.includes("mac os")) return "macos";
    if (ua.includes("android")) return "android";
    if (ua.includes("iphone") || ua.includes("ipad")) return "ios";
    if (ua.includes("linux")) return "linux";
    return "unknown";
  }
}
