"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceFingerprintService = void 0;
const crypto_service_1 = require("../../../shared/security/crypto.service");
class DeviceFingerprintService {
    create(input) {
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
            fingerprintHash: `sha256:${(0, crypto_service_1.sha256)(stablePayload)}`,
            browser,
            os,
            components
        };
    }
    normalize(value) {
        return value.trim().toLowerCase().replace(/\s+/g, " ");
    }
    detectBrowser(userAgent) {
        const ua = userAgent.toLowerCase();
        if (ua.includes("edg/"))
            return "edge";
        if (ua.includes("chrome/"))
            return "chrome";
        if (ua.includes("safari/") && !ua.includes("chrome/"))
            return "safari";
        if (ua.includes("firefox/"))
            return "firefox";
        return "unknown";
    }
    detectOs(userAgent) {
        const ua = userAgent.toLowerCase();
        if (ua.includes("windows"))
            return "windows";
        if (ua.includes("mac os"))
            return "macos";
        if (ua.includes("android"))
            return "android";
        if (ua.includes("iphone") || ua.includes("ipad"))
            return "ios";
        if (ua.includes("linux"))
            return "linux";
        return "unknown";
    }
}
exports.DeviceFingerprintService = DeviceFingerprintService;
