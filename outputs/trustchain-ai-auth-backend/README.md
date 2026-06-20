# TrustChain AI Authentication Backend

Production-oriented Express + TypeScript authentication module for TrustChain AI.

## Includes

- User registration and login
- JWT access and refresh tokens
- Refresh token rotation
- Google Authenticator TOTP enrollment and verification
- Logout and session revocation
- Session tracking in MongoDB
- Device fingerprinting and continuous device trust scoring
- New device, mismatch, low reputation, and suspicious device risk events
- Password reset request and confirmation
- Mongoose models for `users`, `roles`, `sessions`, and `trust_profiles`
- Repositories, DTO validation, middleware, and centralized error handling

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Password reset delivery is intentionally represented by a service boundary. In development the reset token is returned in the API response; in production wire `PasswordResetDelivery` to email/SMS and never return the token.

## Folder Structure

```text
src/
  app.ts
  server.ts
  config/
    database.ts
    env.ts
  shared/
    errors/
    middleware/
    repositories/
    security/
    types/
  modules/
    auth/
      auth.routes.ts
      controllers/
      domain/
      dto/
      middleware/
      services/
    devices/
      controllers/
      domain/
      dto/
      persistence/
      services/
      device.routes.ts
    users/
      domain/
      persistence/
    roles/
      domain/
      persistence/
    sessions/
      domain/
      persistence/
    trust-profiles/
      domain/
      persistence/
    risk-events/
      domain/
      persistence/
    risk-engine/
      domain/
      engines/
      services/
      index.ts
    risk-policies/
      domain/
      persistence/
    ml-predictions/
      domain/
      persistence/
```

## Authentication Flow

1. `POST /api/auth/register`
   - Validates registration DTO.
   - Hashes password with bcrypt.
   - Assigns existing role records, defaulting to `CUSTOMER`.
   - Creates a default trust profile with score `70`.

2. `POST /api/auth/login`
   - Validates email and password.
   - If TOTP is enabled and no code is supplied, returns `requiresTotp: true`.
   - Verifies TOTP when supplied.
   - Creates a MongoDB session.
   - Issues JWT access and refresh tokens.
   - Stores only the refresh token hash in the session.

3. `POST /api/auth/refresh`
   - Verifies refresh JWT signature, issuer, audience, and token use.
   - Finds active session by refresh `jti`.
   - Compares SHA-256 hash of presented refresh token.
   - Rotates refresh token and updates session.

4. `POST /api/auth/totp/enroll`
   - Requires access token.
   - Generates a Speakeasy secret.
   - Encrypts pending TOTP secret with AES-256-GCM.
   - Returns QR code data URL and manual key.

5. `POST /api/auth/totp/verify`
   - Requires access token.
   - Verifies pending TOTP secret.
   - Promotes pending secret to active encrypted secret.

6. `POST /api/auth/logout`
   - Requires access token.
   - Revokes current session, refresh-token session, or all user sessions.

7. Password reset
   - Request endpoint always returns the same public message to prevent account enumeration.
   - Confirmation verifies hashed opaque token and expiry.
   - Password reset revokes all active sessions.

## JWT Strategy

Access token claims:

```text
sub
email
roles
permissions
sessionId
jti
authLevel
trustScore
tokenUse=access
iss
aud
exp
```

Refresh token claims:

```text
sub
sessionId
jti
tokenUse=refresh
iss
aud
exp
```

Access tokens are short-lived. Refresh tokens are long-lived but rotated on every refresh. The backend persists only `refreshTokenHash`, never the raw refresh token.

## Session Creation And Revocation

The `sessions` collection stores:

- User reference
- Access JWT ID
- Refresh JWT ID
- Refresh token hash
- IP address
- User agent
- Auth method
- Risk score
- Trust score
- Status
- Expiry and revocation metadata

Revoked sessions are rejected by `authenticate` middleware even if the JWT signature is valid.

## Device Trust Engine

The Device Trust Engine continuously maintains a `0-100` trust score for every user device.

Collected fingerprint inputs:

```text
User Agent
Browser
OS
Screen Resolution
Timezone
Language
Platform
IP Address
```

The deterministic fingerprint hash is based on stable device/browser attributes. IP address is stored and monitored for mismatch detection, but it is not part of the stable fingerprint hash so normal network movement does not create endless duplicate devices.

Trust classifications:

```text
75-100  TRUSTED
45-74   UNKNOWN
1-44    SUSPICIOUS
0       BLOCKED
```

Device risk signals:

```text
NEW_DEVICE
KNOWN_DEVICE
SUSPICIOUS_DEVICE
DEVICE_MISMATCH
DEVICE_REPUTATION_LOW
```

Device reputation factors:

- Known device status
- Device age
- Successful login count
- Failed login count
- TOTP success count
- Recent high-risk device events
- Recovery attempts
- Suspicious activity count
- Fraud flags

Device APIs:

```text
GET  /devices
GET  /devices/:id
POST /devices/register
POST /devices/trust
POST /devices/block
POST /devices/unblock
```

The same router is also mounted under `/api/devices`.

Authentication integration:

- Failed password attempts for a known user register failed login reputation against the submitted fingerprint.
- Successful login registers or updates the device before session issuance.
- Blocked devices prevent login.
- Accepted devices are attached to the created session.
- New devices and device mismatches create `risk_events`.

Risk Engine hooks:

```ts
const deviceTrustService = new DeviceTrustService();
await deviceTrustService.getDeviceTrustScore(userId, deviceId);
await deviceTrustService.getDeviceRiskSignals(userId, deviceId);
```

## Risk Engine

The Risk Engine combines identity trust, device reputation, session state, recent risk history, policy matches, and ML anomaly predictions.

Core components:

```text
TrustScoreEngine  Calculates 0-100 trust score from user/session/device/risk/ML inputs.
PolicyEngine      Evaluates built-in and MongoDB-backed risk policies.
RiskAggregator    Produces normalized risk score, severity, signals, and explanation.
DecisionEngine    Converts aggregate risk into enforcement decisions.
```

Supported outputs:

```text
ALLOW
ALLOW_MONITOR
STEP_UP_TOTP
BLOCK
LOCK_ACCOUNT
CREATE_CASE
```

Service usage:

```ts
import { RiskEngineService } from "./modules/risk-engine";

const riskEngine = new RiskEngineService();

const result = await riskEngine.evaluateById({
  userId,
  sessionId,
  deviceId,
  eventType: "LOGIN_ATTEMPT",
  eventCategory: "AUTHENTICATION",
  action: "auth.login",
  resource: "sessions"
});
```

`evaluateById()` loads `User`, `Session`, `Device`, `TrustProfile`, recent `RiskEvent` records, active `RiskPolicy` records, and recent `MlPrediction` records. It persists the resulting risk event and updates the user's trust profile.

For lower-level integration, import the individual engines:

```ts
import {
  TrustScoreEngine,
  PolicyEngine,
  RiskAggregator,
  DecisionEngine
} from "./modules/risk-engine";
```

## Blockchain Audit Layer

The blockchain audit layer stores tamper-evident hashes for critical security events only. Sensitive banking data remains off-chain.

On-chain fields:

```text
auditId
userId
eventType
riskLevel
eventHash
timestamp
```

Supported events:

```text
HIGH_RISK_LOGIN_DECISION
ACCOUNT_LOCK_EVENT
ACCOUNT_RECOVERY_APPROVAL
PRIVILEGED_ACCESS_CHANGE
INSIDER_THREAT_ALERT
KYC_DECISION
RISK_ENGINE_FINAL_DECISION
```

Contract, Hardhat, Ganache, deployment, and verification details:

[blockchain/README.md](./blockchain/README.md)

Backend APIs:

```text
GET  /api/blockchain-audit
GET  /api/blockchain-audit/:auditId
POST /api/blockchain-audit/verify
```

## Error Handling

The API uses typed application errors:

- `UnauthorizedError`
- `ForbiddenError`
- `ConflictError`
- `NotFoundError`
- `ValidationError`

All errors are normalized by `errorMiddleware` into:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-safe message"
  }
}
```

## Security Best Practices Implemented

- Bcrypt password hashing with configurable work factor.
- Strong DTO validation with Zod.
- Helmet security headers.
- CORS allowlist.
- Rate limiting on registration, login, refresh, and password reset.
- JWT issuer and audience validation.
- JWT `tokenUse` separation between access and refresh tokens.
- Refresh token rotation and reuse detection.
- Refresh tokens stored as SHA-256 hashes only.
- TOTP secrets encrypted with AES-256-GCM.
- TOTP enrollment uses pending secret promotion after code verification.
- Password reset uses opaque random tokens stored as hashes.
- Password reset revokes all active sessions.
- User enumeration prevention in password reset request.
- Session revocation checked on every authenticated request.

## Required Seed Data

Registration expects role records to exist. At minimum seed:

```json
{
  "name": "CUSTOMER",
  "description": "Default banking customer role",
  "permissions": [],
  "isSystemRole": true
}
```

For admin roles, seed permissions first and attach them to role documents.
