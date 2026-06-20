# TrustChain AI Blockchain Audit Layer

Tamper-evident audit trail for critical security events.

## What Goes On-Chain

Only hashes and references:

- `auditId`: deterministic `bytes32` reference
- `userId`: hashed `bytes32` user reference
- `eventType`: hashed `bytes32` event type
- `riskLevel`: enum value
- `eventHash`: `bytes32` SHA-256 hash of canonical off-chain audit payload
- `timestamp`: block timestamp

Never store raw PII, KYC documents, IP addresses, session tokens, customer account data, or investigation notes on-chain.

## Supported Event Types

```text
HIGH_RISK_LOGIN_DECISION
ACCOUNT_LOCK_EVENT
ACCOUNT_RECOVERY_APPROVAL
PRIVILEGED_ACCESS_CHANGE
INSIDER_THREAT_ALERT
KYC_DECISION
RISK_ENGINE_FINAL_DECISION
```

## Local Ganache

From the backend root:

```bash
docker compose up ganache
```

Or from this `blockchain/` directory:

```bash
npm run ganache
```

## Deploy

```bash
npm install
npm run compile
npm run deploy:ganache
```

Deployment output is written to:

```text
blockchain/deployments/ganache.json
```

## Grant Backend Writer

```bash
AUDIT_TRAIL_CONTRACT_ADDRESS=0x...
BACKEND_WRITER_ADDRESS=0x...
npx hardhat run scripts/add-backend-writer.ts --network ganache
```

## Verify Audit Hash

```bash
AUDIT_TRAIL_CONTRACT_ADDRESS=0x...
AUDIT_ID=0x...
EVENT_HASH=0x...
npx hardhat run scripts/verify-audit.ts --network ganache
```

## Backend Integration

Configure the Node backend:

```text
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
AUDIT_TRAIL_CONTRACT_ADDRESS=0x...
BACKEND_WRITER_PRIVATE_KEY=0x...
```

Backend APIs:

```text
GET  /api/blockchain-audit
GET  /api/blockchain-audit/:auditId
POST /api/blockchain-audit/verify
```

Integration examples:

```text
src/modules/blockchain-audit/examples/audit-integration.examples.ts
```
