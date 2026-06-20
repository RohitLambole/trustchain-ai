import QRCode from "qrcode";
import speakeasy from "speakeasy";
import { env } from "../../../config/env";

export class TotpService {
  generateSecret(email: string) {
    return speakeasy.generateSecret({
      name: `${env.TOTP_ISSUER}:${email}`,
      issuer: env.TOTP_ISSUER,
      length: 32
    });
  }

  async createQrDataUrl(otpauthUrl: string) {
    return QRCode.toDataURL(otpauthUrl);
  }

  verify(code: string, secretBase32: string) {
    return speakeasy.totp.verify({
      secret: secretBase32,
      encoding: "base32",
      token: code,
      window: 1
    });
  }
}
