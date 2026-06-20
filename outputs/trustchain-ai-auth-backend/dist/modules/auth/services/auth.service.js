"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const mongoose_1 = require("mongoose");
const env_1 = require("../../../config/env");
const app_error_1 = require("../../../shared/errors/app-error");
const crypto_service_1 = require("../../../shared/security/crypto.service");
const device_trust_service_1 = require("../../devices/services/device-trust.service");
const role_repository_1 = require("../../roles/persistence/role.repository");
const session_repository_1 = require("../../sessions/persistence/session.repository");
const trust_profile_repository_1 = require("../../trust-profiles/persistence/trust-profile.repository");
const user_repository_1 = require("../../users/persistence/user.repository");
const jwt_service_1 = require("./jwt.service");
const password_service_1 = require("./password.service");
const session_service_1 = require("./session.service");
const totp_service_1 = require("./totp.service");
class AuthService {
    users;
    roles;
    trustProfiles;
    sessions;
    passwordService;
    jwtService;
    totpService;
    sessionService;
    deviceTrustService;
    constructor(users = new user_repository_1.UserRepository(), roles = new role_repository_1.RoleRepository(), trustProfiles = new trust_profile_repository_1.TrustProfileRepository(), sessions = new session_repository_1.SessionRepository(), passwordService = new password_service_1.PasswordService(), jwtService = new jwt_service_1.JwtService(), totpService = new totp_service_1.TotpService(), sessionService = new session_service_1.SessionService(), deviceTrustService = new device_trust_service_1.DeviceTrustService()) {
        this.users = users;
        this.roles = roles;
        this.trustProfiles = trustProfiles;
        this.sessions = sessions;
        this.passwordService = passwordService;
        this.jwtService = jwtService;
        this.totpService = totpService;
        this.sessionService = sessionService;
        this.deviceTrustService = deviceTrustService;
    }
    async register(dto) {
        const existing = await this.users.findByEmail(dto.email);
        if (existing) {
            throw new app_error_1.ConflictError("Email is already registered");
        }
        const roleDocs = await Promise.all(dto.roleNames.map((roleName) => this.roles.findByName(roleName)));
        const missingRole = roleDocs.findIndex((role) => !role);
        if (missingRole >= 0) {
            throw new app_error_1.ForbiddenError(`Unknown role: ${dto.roleNames[missingRole]}`);
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
            roles: roleDocs.map((role) => role._id),
            totpEnabled: false
        });
        const trustProfile = await this.trustProfiles.createDefault(user._id.toString());
        await this.users.updateById(user._id.toString(), { $set: { riskProfileId: trustProfile._id } });
        return this.publicUser(user);
    }
    async login(dto, context) {
        const user = await this.users.findByEmailWithSecrets(dto.email);
        if (!user) {
            throw new app_error_1.UnauthorizedError("Invalid email or password");
        }
        const passwordMatches = await this.passwordService.verify(dto.password, user.passwordHash);
        if (!passwordMatches) {
            await this.deviceTrustService.registerFailedLogin(user._id.toString(), this.deviceInput(dto.device, context));
            throw new app_error_1.UnauthorizedError("Invalid email or password");
        }
        if (user.status !== "ACTIVE" && user.status !== "PENDING_KYC") {
            throw new app_error_1.ForbiddenError(`User is ${user.status.toLowerCase()}`);
        }
        let authLevel = "PASSWORD";
        if (user.totpEnabled) {
            if (!dto.totpCode) {
                return {
                    requiresTotp: true,
                    message: "TOTP code required"
                };
            }
            if (!user.totpSecretEncrypted) {
                throw new app_error_1.UnauthorizedError("TOTP is not configured correctly");
            }
            const secret = (0, crypto_service_1.decryptField)(user.totpSecretEncrypted);
            if (!this.totpService.verify(dto.totpCode, secret)) {
                throw new app_error_1.UnauthorizedError("Invalid TOTP code");
            }
            authLevel = "TOTP";
        }
        const trustProfile = await this.trustProfiles.findByUserId(user._id.toString());
        const trustScore = trustProfile?.currentTrustScore ?? 70;
        const riskScore = Math.max(0, 100 - trustScore);
        const deviceResult = await this.deviceTrustService.registerSuccessfulLogin(user._id.toString(), this.deviceInput(dto.device, context), { totpSuccess: authLevel === "TOTP" });
        const sessionId = new mongoose_1.Types.ObjectId().toString();
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
    async refresh(dto) {
        const claims = this.jwtService.verifyRefreshToken(dto.refreshToken);
        const session = await this.sessions.findActiveByRefreshJwtIdWithSecret(claims.jti);
        if (!session || session._id.toString() !== claims.sessionId) {
            throw new app_error_1.UnauthorizedError("Invalid refresh token");
        }
        if (session.refreshExpiresAt.getTime() <= Date.now() || session.refreshTokenHash !== (0, crypto_service_1.sha256)(dto.refreshToken)) {
            await this.sessions.revoke(session._id.toString(), "refresh token reuse or expiry");
            throw new app_error_1.UnauthorizedError("Invalid refresh token");
        }
        const user = await this.users.findByIdWithRoles(claims.sub);
        if (!user || user.status !== "ACTIVE") {
            throw new app_error_1.UnauthorizedError("User is not active");
        }
        const trustProfile = await this.trustProfiles.findByUserId(user._id.toString());
        const trustScore = trustProfile?.currentTrustScore ?? 70;
        const tokenPair = this.jwtService.createTokenPair(this.buildClaims(user, session._id.toString(), session.authMethod === "PASSWORD_TOTP" ? "TOTP" : "PASSWORD", trustScore));
        await this.sessions.rotateRefreshToken(session._id.toString(), tokenPair.refreshJwtId, (0, crypto_service_1.sha256)(tokenPair.refreshToken), tokenPair.refreshTokenExpiresAt);
        await this.sessionService.setAccessJwtId(session._id.toString(), tokenPair.accessJwtId);
        return this.publicTokens(tokenPair);
    }
    async enrollTotp(userId) {
        const user = await this.users.findByEmailWithSecrets((await this.users.findById(userId))?.email ?? "");
        if (!user) {
            throw new app_error_1.UnauthorizedError();
        }
        const secret = this.totpService.generateSecret(user.email);
        if (!secret.base32 || !secret.otpauth_url) {
            throw new Error("Unable to create TOTP secret");
        }
        await this.users.setPendingTotpSecret(user._id.toString(), (0, crypto_service_1.encryptField)(secret.base32));
        const qrCodeDataUrl = await this.totpService.createQrDataUrl(secret.otpauth_url);
        return {
            issuer: env_1.env.TOTP_ISSUER,
            qrCodeDataUrl,
            manualEntryKey: secret.base32
        };
    }
    async verifyTotp(userId, dto) {
        const user = await this.users.findByEmailWithSecrets((await this.users.findById(userId))?.email ?? "");
        if (!user?.pendingTotpSecretEncrypted) {
            throw new app_error_1.UnauthorizedError("No pending TOTP enrollment");
        }
        const pendingSecret = (0, crypto_service_1.decryptField)(user.pendingTotpSecretEncrypted);
        if (!this.totpService.verify(dto.code, pendingSecret)) {
            throw new app_error_1.UnauthorizedError("Invalid TOTP code");
        }
        await this.users.enableTotp(user._id.toString(), (0, crypto_service_1.encryptField)(pendingSecret));
        return { enabled: true };
    }
    async logout(userId, sessionId, dto) {
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
    async requestPasswordReset(dto) {
        const user = await this.users.findByEmail(dto.email);
        const token = (0, crypto_service_1.createOpaqueToken)();
        if (user) {
            const expiresAt = new Date(Date.now() + env_1.env.PASSWORD_RESET_TTL_SECONDS * 1000);
            await this.users.setPasswordReset(user._id, (0, crypto_service_1.sha256)(token), expiresAt);
        }
        return {
            message: "If the account exists, a password reset instruction has been issued.",
            developmentResetToken: env_1.env.NODE_ENV === "production" ? undefined : token
        };
    }
    async confirmPasswordReset(dto) {
        const user = await this.users.findByEmailWithSecrets(dto.email);
        if (!user?.passwordResetTokenHash ||
            !user.passwordResetExpiresAt ||
            user.passwordResetExpiresAt.getTime() <= Date.now() ||
            user.passwordResetTokenHash !== (0, crypto_service_1.sha256)(dto.token)) {
            throw new app_error_1.UnauthorizedError("Invalid or expired password reset token");
        }
        const passwordHash = await this.passwordService.hash(dto.newPassword);
        await this.users.updatePassword(user._id.toString(), passwordHash);
        await this.sessionService.revokeAllForUser(user._id.toString(), "password reset");
        return { passwordReset: true };
    }
    buildClaims(user, sessionId, authLevel, trustScore) {
        const roles = (user.roles ?? []).map((role) => role.name).filter(Boolean);
        const permissions = (user.roles ?? [])
            .flatMap((role) => role.permissions ?? [])
            .map((permission) => permission.code)
            .filter(Boolean);
        return {
            sub: user._id.toString(),
            email: user.email,
            roles,
            permissions: [...new Set(permissions)],
            sessionId,
            authLevel,
            trustScore
        };
    }
    publicTokens(tokenPair) {
        return {
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
            accessTokenExpiresAt: tokenPair.accessTokenExpiresAt,
            refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt
        };
    }
    deviceInput(device, context) {
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
    publicUser(user) {
        return {
            id: user._id.toString(),
            email: user.email,
            phone: user.phone,
            customerId: user.customerId,
            employeeId: user.employeeId,
            status: user.status,
            kycStatus: user.kycStatus,
            totpEnabled: user.totpEnabled,
            roles: (user.roles ?? []).map((role) => role.name ?? role.toString())
        };
    }
}
exports.AuthService = AuthService;
