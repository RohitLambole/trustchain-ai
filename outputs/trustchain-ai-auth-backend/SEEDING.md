# TrustChain AI Database Seeding

The seed system is idempotent and safe to run repeatedly in local and demo environments.

## Run

With a local `.env` file:

```bash
npm run seed
```

With explicit environment values:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/trustchain_ai npm run seed
```

For compiled production output:

```bash
npm run build
npm run seed:prod
```

## Startup Bootstrap

Set this environment variable to seed automatically when the backend starts:

```text
BOOTSTRAP_DATABASE_ON_START=true
```

Docker Compose enables this for local development.

## Seeded Permissions

```text
users.read
users.write
devices.read
devices.write
risk.read
risk.write
audit.read
audit.write
kyc.read
kyc.write
```

## Seeded Roles

```text
CUSTOMER
EMPLOYEE
MANAGER
SECURITY_ANALYST
ADMIN
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Customer | customer@trustchain.local | DemoCustomer!2026 |
| Employee | employee@trustchain.local | DemoEmployee!2026 |
| Security Analyst | analyst@trustchain.local | DemoAnalyst!2026 |
| Admin | admin@trustchain.local | DemoAdmin!2026 |

## Seeded Demo Data

Each user receives:

- Trust profile
- Trusted device
- Suspicious device
- Successful login history
- Failed login history
- Device mismatch risk event

## Registration Safety

Registration auto-creates the `CUSTOMER` role if the database is fresh and the role has not been seeded yet. Other elevated roles must be seeded or explicitly created by an administrator.
