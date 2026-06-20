import bcrypt from "bcrypt";
import { env } from "../config/env";
import { DeviceModel } from "../modules/devices/persistence/device.model";
import { LoginEventModel } from "../modules/login-events/persistence/login-event.model";
import { PermissionModel } from "../modules/roles/persistence/permission.model";
import { RoleModel } from "../modules/roles/persistence/role.model";
import { RiskEventModel } from "../modules/risk-events/persistence/risk-event.model";
import { SessionModel } from "../modules/sessions/persistence/session.model";
import { TrustProfileModel } from "../modules/trust-profiles/persistence/trust-profile.model";
import { UserModel } from "../modules/users/persistence/user.model";
import { demoUsersSeed, permissionsSeed, rolesSeed } from "./seed-data";

export interface SeedResult {
  permissions: number;
  roles: number;
  users: number;
  devices: number;
  loginEvents: number;
  riskEvents: number;
}

export class DatabaseSeeder {
  async seed(): Promise<SeedResult> {
    const permissions = await this.seedPermissions();
    const roles = await this.seedRoles();
    const users = await this.seedUsers();
    const devices = await this.seedDevicesAndActivity();

    return {
      permissions,
      roles,
      users: users.length,
      devices: devices.devices,
      loginEvents: devices.loginEvents,
      riskEvents: devices.riskEvents
    };
  }

  private async seedPermissions() {
    let count = 0;
    for (const code of permissionsSeed) {
      const [resource, action] = code.split(".");
      await PermissionModel.updateOne(
        { code },
        {
          $setOnInsert: {
            resource,
            action,
            scope: "ANY",
            code,
            description: `Allows ${action} access to ${resource}.`,
            riskLevel: action === "write" ? "HIGH" : "LOW"
          }
        },
        { upsert: true }
      ).exec();
      count += 1;
    }
    return count;
  }

  private async seedRoles() {
    let count = 0;
    for (const roleSeed of rolesSeed) {
      const permissions = await PermissionModel.find({ code: { $in: roleSeed.permissions } }).exec();
      await RoleModel.updateOne(
        { name: roleSeed.name },
        {
          $set: {
            description: roleSeed.description,
            permissions: permissions.map((permission) => permission._id),
            isSystemRole: true
          }
        },
        { upsert: true }
      ).exec();
      count += 1;
    }
    return count;
  }

  private async seedUsers() {
    const users = [];
    for (const userSeed of demoUsersSeed) {
      const customerId = "customerId" in userSeed ? userSeed.customerId : undefined;
      const employeeId = "employeeId" in userSeed ? userSeed.employeeId : undefined;
      const roles = await RoleModel.find({ name: { $in: userSeed.roles } }).exec();
      const passwordHash = await bcrypt.hash(userSeed.password, env.PASSWORD_BCRYPT_ROUNDS);
      const update = {
        email: userSeed.email,
        phone: userSeed.phone,
        passwordHash,
        status: "ACTIVE",
        kycStatus: "APPROVED",
        roles: roles.map((role) => role._id),
        totpEnabled: false,
        ...(customerId ? { customerId } : {}),
        ...(employeeId ? { employeeId } : {})
      };

      const user = await UserModel.findOneAndUpdate(
        { email: userSeed.email },
        { $set: update },
        { upsert: true, new: true }
      ).exec();

      const trustProfile = await TrustProfileModel.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            currentTrustScore: userSeed.trustScore,
            baselineBehavior: { loginHours: [9, 10, 18], normalCountries: ["US", "IN"] },
            riskFlags: [],
            lastCalculatedAt: new Date()
          },
          $setOnInsert: {
            knownDevices: [],
            knownLocations: [{ country: "US", region: "NY", city: "New York" }],
            scoreHistory: [{ score: userSeed.trustScore, reason: "DEMO_SEED", at: new Date() }]
          }
        },
        { upsert: true, new: true }
      ).exec();

      await UserModel.updateOne({ _id: user._id }, { $set: { riskProfileId: trustProfile._id } }).exec();
      users.push(user);
    }
    return users;
  }

  private async seedDevicesAndActivity() {
    let devices = 0;
    let loginEvents = 0;
    let riskEvents = 0;
    const users = await UserModel.find({ email: { $in: demoUsersSeed.map((user) => user.email) } }).exec();

    for (const user of users) {
      const profile = await TrustProfileModel.findOne({ userId: user._id }).exec();
      const baseTrust = profile?.currentTrustScore ?? 70;
      const trustedDevice = await DeviceModel.findOneAndUpdate(
        { userId: user._id, fingerprintHash: `sha256:demo:${user.email}:trusted` },
        {
          $set: {
            userId: user._id,
            fingerprintHash: `sha256:demo:${user.email}:trusted`,
            userAgent: "Mozilla/5.0 Demo Trusted Device",
            browser: "chrome",
            os: "windows",
            screenResolution: "1440x900",
            timezone: "Asia/Kolkata",
            language: "en-US",
            platform: "Win32",
            firstIpAddress: "203.0.113.10",
            lastIpAddress: "203.0.113.10",
            firstSeenAt: new Date(Date.now() - 45 * 86_400_000),
            lastSeenAt: new Date(),
            trustScore: Math.min(96, baseTrust + 8),
            trustLevel: "TRUSTED",
            trusted: true,
            successfulLoginCount: 24,
            failedLoginCount: 0,
            totpSuccessCount: 6,
            recoveryAttemptCount: 0,
            suspiciousActivityCount: 0,
            riskFlags: [],
            fraudFlags: []
          }
        },
        { upsert: true, new: true }
      ).exec();

      const suspiciousDevice = await DeviceModel.findOneAndUpdate(
        { userId: user._id, fingerprintHash: `sha256:demo:${user.email}:suspicious` },
        {
          $set: {
            userId: user._id,
            fingerprintHash: `sha256:demo:${user.email}:suspicious`,
            userAgent: "Mozilla/5.0 Demo Suspicious Device",
            browser: "firefox",
            os: "linux",
            screenResolution: "1366x768",
            timezone: "UTC",
            language: "en-US",
            platform: "Linux x86_64",
            firstIpAddress: "198.51.100.44",
            lastIpAddress: "198.51.100.99",
            firstSeenAt: new Date(Date.now() - 2 * 86_400_000),
            lastSeenAt: new Date(Date.now() - 2 * 60 * 60_000),
            trustScore: 28,
            trustLevel: "SUSPICIOUS",
            trusted: false,
            successfulLoginCount: 1,
            failedLoginCount: 6,
            totpSuccessCount: 0,
            recoveryAttemptCount: 1,
            suspiciousActivityCount: 2,
            riskFlags: ["NEW_DEVICE", "DEVICE_MISMATCH"],
            fraudFlags: []
          }
        },
        { upsert: true, new: true }
      ).exec();

      devices += 2;
      await TrustProfileModel.updateOne({ userId: user._id }, { $addToSet: { knownDevices: trustedDevice._id } }).exec();
      await SessionModel.updateMany(
        { userId: user._id, status: "ACTIVE" },
        { $set: { status: "EXPIRED" } }
      ).exec();

      await this.upsertLoginEvent({
        userId: user._id,
        deviceId: trustedDevice._id,
        eventType: "LOGIN_SUCCESS",
        success: true,
        ipAddress: "203.0.113.10",
        geoLocation: { country: "IN", region: "MH", city: "Mumbai" },
        riskScore: 12,
        trustScore: baseTrust,
        decision: "ALLOW"
      });
      await this.upsertLoginEvent({
        userId: user._id,
        deviceId: suspiciousDevice._id,
        eventType: "LOGIN_FAILURE",
        success: false,
        failureReason: "INVALID_PASSWORD",
        ipAddress: "198.51.100.99",
        geoLocation: { country: "US", region: "CA", city: "San Francisco" },
        riskScore: 72,
        trustScore: Math.max(20, baseTrust - 35),
        decision: "STEP_UP_TOTP"
      });
      loginEvents += 2;

      await RiskEventModel.updateOne(
        { userId: user._id, deviceId: suspiciousDevice._id, eventType: "DEMO_DEVICE_MISMATCH" },
        {
          $set: {
            userId: user._id,
            deviceId: suspiciousDevice._id,
            eventCategory: "DEVICE",
            eventType: "DEMO_DEVICE_MISMATCH",
            severity: "HIGH",
            riskScore: 74,
            trustScoreBefore: baseTrust,
            trustScoreAfter: Math.max(20, baseTrust - 30),
            signals: [
              { name: "NEW_DEVICE", value: true, weight: 20, reason: "Seeded suspicious demo device" },
              { name: "DEVICE_MISMATCH", value: true, weight: 25, reason: "Seeded browser/IP mismatch" }
            ],
            mlScore: 0.82,
            decision: "STEP_UP_TOTP",
            enforcementAction: "STEP_UP_TOTP"
          }
        },
        { upsert: true }
      ).exec();
      riskEvents += 1;
    }

    return { devices, loginEvents, riskEvents };
  }

  private async upsertLoginEvent(payload: Record<string, unknown>) {
    await LoginEventModel.updateOne(
      {
        userId: payload["userId"],
        deviceId: payload["deviceId"],
        eventType: payload["eventType"],
        ipAddress: payload["ipAddress"]
      },
      { $set: payload },
      { upsert: true }
    ).exec();
  }
}
