# TrustChain AI Local Development

This setup starts the complete TrustChain AI stack with one command:

```bash
docker compose up --build
```

Equivalent npm shortcut:

```bash
npm run dev:stack
```

## Services

| Service | URL | Purpose |
|---|---|---|
| Frontend | http://localhost:3000/login | Next.js dashboard |
| Backend | http://localhost:4000/health | Express API |
| ML Service | http://localhost:8000/health | FastAPI anomaly detection |
| Ganache | http://localhost:8545 | Local blockchain |
| MongoDB | mongodb://localhost:27017/trustchain_ai | Operational database |

## One-Command Startup

From the project root:

```bash
docker compose up --build
```

The compose graph starts services in this order:

1. MongoDB
2. Ganache
3. Blockchain deployer
4. Express backend
5. ML service
6. Next.js frontend

The backend runs database bootstrap on startup in Docker Compose:

```text
BOOTSTRAP_DATABASE_ON_START=true
```

This seeds demo roles, permissions, users, trust profiles, devices, login history, and risk events.

The blockchain deployer uses the deterministic Ganache mnemonic and deploys `AuditTrail.sol` at the expected local development address:

```text
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## Health Checks

Backend:

```bash
curl http://localhost:4000/health
```

ML service:

```bash
curl http://localhost:8000/health
```

Frontend:

```bash
curl http://localhost:3000/login
```

Ganache:

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}"
```

Blockchain audit API:

```bash
curl http://localhost:4000/api/blockchain-audit
```

## Environment Files

Examples are provided for manual non-Docker development:

```text
.env.example
apps/frontend/.env.local.example
apps/ml-service/.env.example
```

Docker Compose injects working local values directly, so copying these files is not required for the one-command stack.

## Deterministic Local Blockchain

Ganache mnemonic:

```text
test test test test test test test test test test test junk
```

Backend writer private key:

```text
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

This key is for local development only.

## Shutdown

```bash
docker compose down -v
```

or:

```bash
npm run dev:stack:down
```

The `-v` flag clears MongoDB and persisted ML model volumes for a clean reset.
