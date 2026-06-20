import { Types } from "mongoose";
import { env } from "../../../config/env";
import { ConflictError, ForbiddenError, UnauthorizedError } from "../../../shared/errors/app-error";
import { createOpaqueToken, decryptField, encryptField, sha256 } from "../../../shared/security/crypto.service";
import { DeviceTrustService } from "../../devices/services/device-trust.service";
import { RoleRepository } from "../../roles/persistence/role.repository";
import { SessionRepository } from "../../sessions/persistence/session.repository";
import { TrustProfileRepository } from "../../trust-profiles/persistence/trust-profile.repository";
import { UserRepository } from "../../users/persistence/user.repository";
import type {
  LoginDto,
  LogoutDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
  RefreshTokenDto,
  RegisterDto,
  TotpVerifyDto
} from "../dto/auth.dto";
import { JwtService } from "./jwt.service";
import { PasswordService } from "./password.service";
import { SessionService } from "./session.service";
import { TotpService } from "./totp.service";

export interface RequestContext {
  ipAddress: string;
  userAgent?: string;
}

export class AuthService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly roles = new RoleRepository(),
    private readonly trustProfiles = new TrustProfileRepository(),
    private readonly sessions = new SessionRepository(),
    private readonly passwordService = new PasswordService(),
    private readonly jwtService = new JwtService(),
    private readonly totpService = new TotpService(),
    private readonly sessionService = new SessionService(),
    private readonly deviceTrustService = new DeviceTrustService()
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError("Email is already registered");
    }

    const roleDocs = await Promise.all(
      dto.roleNames.map(async (roleName) => {
        const role = await this.roles.findByName(roleName);
        if (role) return role;
        if (roleName.toUpperCase() === "CUSTOMER") {
          return this.roles.findOrCreateSystemRole("CUSTOMER", "Customer account holder with access to personal security posture.");
        }
        return null;
      })
    );
    const missingRole = roleDocs.findIndex((role) => !role);
    if (missingRole >= 0) {
      throw new ForbiddenError(`Unknown role: ${dto.roleNames[missingRole]}`);
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.users.create({
      email: dto.email,
      phone: dto.phone,
      customerId: dto.customerId,
      employeeId: dto.employeeId,
      passwordHash,
      status: "ACTIVE",
      kycStatus: "NOT_STARTED",
      roles: roleDocs.map((role) => role!._id),
      totpEnabled: false
    });

    const trustProfile = await this.trustProfiles.createDefault(user._id.toString());
    await this.users.updateById(user._id.toString(), { $set: { riskProfileId: trustProfile._id } });

    return this.publicUser(user);
  }

  async login(dto: LoginDto, context: RequestContext) {
    const user = await this.users.findByEmailWithSecrets(dto.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const passwordMatches = await this.passwordService.verify(dto.password, user.passwordHash);
    if (!passwordMatches) {
      await this.deviceTrustService.registerFailedLogin(user._id.toString(), this.deviceInput(dto.device, context));
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status !== "ACTIVE" && user.status !== "PENDING_KYC") {
      throw new ForbiddenError(`User is ${user.status.toLowerCase()}`);
    }

    let authLevel: "PASSWORD" | "TOTP" = "PASSWORD";
    if (user.totpEnabled) {
      if (!dto.totpCode) {
        return {
          requiresTotp: true,
          message: "TOTP code required"
        };
      }

      if (!user.totpSecretEncrypted) {
        throw new UnauthorizedError("TOTP is not configured correctly");
      }

      const secret = decryptField(user.totpSecretEncrypted);
      if (!this.totpService.verify(dto.totpCode, secret)) {
        throw new UnauthorizedError("Invalid TOTP code");
      }
      authLevel = "TOTP";
    }

    const trustProfile = await this.trustProfiles.findByUserId(user._id.toString());
    const trustScore = trustProfile?.currentTrustScore ?? 70;
    const riskScore = Math.max(0, 100 - trustScore);
    const deviceResult = await this.deviceTrustService.registerSuccessfulLogin(
      user._id.toString(),
      this.deviceInput(dto.device, context),
      { totpSuccess: authLevel === "TOTP" }
    );

    const sessionId = new Types.ObjectId().toString();
    const claims = this.buildClaims(user, sessionId, authLevel, trustScore);
    const tokenPair = this.jwtService.createTokenPair(claims);
    const session = await this.sessionService.create({
      sessionId,
      userId: user._id.toString(),
      refreshJwtId: tokenPair.refreshJwtId,
      refreshToken: tokenPair.refreshToken,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      authMethod: authLevel === "TOTP" ? "PASSWORD_TOTP" : "PASSWORD",
      riskScore,
      trustScore,
      accessTokenExpiresAt: tokenPair.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt
    });
    await this.sessionService.setAccessJwtId(session._id.toString(), tokenPair.accessJwtId);
    await this.sessions.updateById(session._id.toString(), { $set: { deviceId: deviceResult.device._id } });
    await this.users.updateLastLogin(user._id.toString());

    return {
      requiresTotp: false,
      user: this.publicUser(user),
      sessionId: session._id.toString(),
      device: {
        id: deviceResult.device._id.toString(),
        trustScore: deviceResult.device.trustScore,
        trustLevel: deviceResult.device.trustLevel,
        isNew: deviceResult.isNew,
        signals: deviceResult.signals
      },
      ...this.publicTokens(tokenPair)
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const claims = this.jwtService.verifyRefreshToken(dto.refreshToken);
    const session = await this.sessions.findActiveByRefreshJwtIdWithSecret(claims.jti);
    if (!session || session._id.toString() !== claims.sessionId) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (session.refreshExpiresAt.getTime() <= Date.now() || session.refreshTokenHash !== sha256(dto.refreshToken)) {
      await this.sessions.revoke(session._id.toString(), "refresh token reuse or expiry");
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await this.users.findByIdWithRoles(claims.sub);
    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedError("User is not active");
    }

    const trustProfile = await this.trustProfiles.findByUserId(user._id.toString());
    const trustScore = trustProfile?.currentTrustScore ?? 70;
    const tokenPair = this.jwtService.createTokenPair(
      this.buildClaims(user, session._id.toString(), session.authMethod === "PASSWORD_TOTP" ? "TOTP" : "PASSWORD", trustScore)
    );

    await this.sessions.rotateRefreshToken(
      session._id.toString(),
      tokenPair.refreshJwtId,
      sha256(tokenPair.refreshToken),
      tokenPair.refreshTokenExpiresAt
    );
    await this.sessionService.setAccessJwtId(session._id.toString(), tokenPair.accessJwtId);

    return this.publicTokens(tokenPair);
  }

  async enrollTotp(userId: string) {
    const user = await this.users.findByEmailWithSecrets((await this.users.findById(userId))?.email ?? "");
    if (!user) {
      throw new UnauthorizedError();
    }

    const secret = this.totpService.generateSecret(user.email);
    if (!secret.base32 || !secret.otpauth_url) {
      throw new Error("Unable to create TOTP secret");
    }

    await this.users.setPendingTotpSecret(user._id.toString(), encryptField(secret.base32));
    const qrCodeDataUrl = await this.totpService.createQrDataUrl(secret.otpauth_url);

    return {
      issuer: env.TOTP_ISSUER,
      qrCodeDataUrl,
      manualEntryKey: secret.base32
    };
  }

  async verifyTotp(userId: string, dto: TotpVerifyDto) {
    const user = await this.users.findByEmailWithSecrets((await this.users.findById(userId))?.email ?? "");
    if (!user?.pendingTotpSecretEncrypted) {
      throw new UnauthorizedError("No pending TOTP enrollment");
    }

    const pendingSecret = decryptField(user.pendingTotpSecretEncrypted);
    if (!this.totpService.verify(dto.code, pendingSecret)) {
      throw new UnauthorizedError("Invalid TOTP code");
    }

    await this.users.enableTotp(user._id.toString(), encryptField(pendingSecret));
    return { enabled: true };
  }

  async logout(userId: string, sessionId: string, dto: LogoutDto) {
    if (dto.allSessions) {
      await this.sessionService.revokeAllForUser(userId, "user logout all sessions");
      return { revoked: "all" };
    }

    if (dto.refreshToken) {
      const claims = this.jwtService.verifyRefreshToken(dto.refreshToken);
      await this.sessions.revokeByRefreshJwtId(claims.jti, "user logout");
      return { revoked: claims.sessionId };
    }

    await this.sessionService.revoke(sessionId, "user logout");
    return { revoked: sessionId };
  }

  async requestPasswordReset(dto: PasswordResetRequestDto) {
    const user = await this.users.findByEmail(dto.email);
    const token = createOpaqueToken();

    if (user) {
      const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_SECONDS * 1000);
      await this.users.setPasswordReset(user._id, sha256(token), expiresAt);
    }

    return {
      message: "If the account exists, a password reset instruction has been issued.",
      developmentResetToken: env.NODE_ENV === "production" ? undefined : token
    };
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto) {
    const user = await this.users.findByEmailWithSecrets(dto.email);
    if (
      !user?.passwordResetTokenHash ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() <= Date.now() ||
      user.passwordResetTokenHash !== sha256(dto.token)
    ) {
      throw new UnauthorizedError("Invalid or expired password reset token");
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.users.updatePassword(user._id.toString(), passwordHash);
    await this.sessionService.revokeAllForUser(user._id.toString(), "password reset");

    return { passwordReset: true };
  }

  private buildClaims(user: any, sessionId: string, authLevel: "PASSWORD" | "TOTP", trustScore: number) {
    const roles = (user.roles ?? []).map((role: any) => role.name).filter(Boolean);
    const permissions = (user.roles ?? [])
      .flatMap((role: any) => role.permissions ?? [])
      .map((permission: any) => permission.code)
      .filter(Boolean);

    return {
      sub: user._id.toString(),
      email: user.email,
      roles,
      permissions: [...new Set<string>(permissions)],
      sessionId,
      authLevel,
      trustScore
    };
  }

  private publicTokens(tokenPair: { accessToken: string; refreshToken: string; accessTokenExpiresAt: Date; refreshTokenExpiresAt: Date }) {
    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      accessTokenExpiresAt: tokenPair.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt
    };
  }

  private deviceInput(device: LoginDto["device"], context: RequestContext) {
    return {
      userAgent: device?.userAgent ?? context.userAgent ?? "unknown",
      browser: device?.browser,
      os: device?.os,
      screenResolution: device?.screenResolution,
      timezone: device?.timezone,
      language: device?.language,
      platform: device?.platform,
      ipAddress: device?.ipAddress ?? context.ipAddress
    };
  }

  private publicUser(user: any) {
    return {
      id: user._id.toString(),
      email: user.email,
      phone: user.phone,
      customerId: user.customerId,
      employeeId: user.employeeId,
      status: user.status,
      kycStatus: user.kycStatus,
      totpEnabled: user.totpEnabled,
      roles: (user.roles ?? []).map((role: any) => role.name ?? role.toString())
    };
  }
}
