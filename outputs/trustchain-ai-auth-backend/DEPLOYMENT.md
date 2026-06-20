# TrustChain AI Railway Deployment

This is the production deployment plan for hackathon judging. The application services run on Railway; MongoDB Atlas remains the managed database; Polygon Amoy remains the blockchain audit network.

## Production Topology

```text
Railway project: trustchain-ai

trustchain-frontend public Railway domain
  -> trustchain-backend public Railway domain /api
      -> MongoDB Atlas
      -> trustchain-ml-service over Railway private networking
      -> Polygon Amoy AuditTrail contract
```

Local MongoDB and Ganache stay available through `docker-compose.yml` for local development only.

## Railway Services

Create one Railway project with three services from the same GitHub repository.

```text
Service: trustchain-backend
Root Directory: outputs/trustchain-ai-auth-backend
Builder: Dockerfile
Dockerfile Path: ./Dockerfile
Healthcheck Path: /health
Public Domain: enabled
```

```text
Service: trustchain-ml-service
Root Directory: outputs/trustchain-ai-auth-backend/apps/ml-service
Builder: Dockerfile
Dockerfile Path: ./Dockerfile
Healthcheck Path: /health
Public Domain: optional for debugging, not required by backend
```

```text
Service: trustchain-frontend
Root Directory: outputs/trustchain-ai-auth-backend/apps/frontend
Builder: Dockerfile
Dockerfile Path: ./Dockerfile
Public Domain: enabled
```

If the repository root is already `trustchain-ai-auth-backend`, remove the `outputs/trustchain-ai-auth-backend` prefix from all root directories.

Railway supports isolated monorepo services by setting a separate root directory per service. The frontend, backend, and ML service are isolated deployable directories in this repo.

## Railway Service-To-Service Communication

Use Railway private networking for backend-to-ML traffic.

Set this on `trustchain-backend`:

```text
ML_SERVICE_URL=http://${{trustchain-ml-service.RAILWAY_PRIVATE_DOMAIN}}:${{trustchain-ml-service.PORT}}
```

Fallback if Railway variable interpolation is not available in the UI:

```text
ML_SERVICE_URL=http://trustchain-ml-service.railway.internal:<ml-service-port>
```

The ML service does not need to be publicly exposed for normal application traffic. Keep the frontend pointed at the backend public domain only.

## MongoDB Atlas Integration

1. Create a MongoDB Atlas project and cluster.
2. Create a database user with read/write access to `trustchain_ai`.
3. In Atlas Network Access, allow Railway outbound access. For hackathon judging, `0.0.0.0/0` is acceptable if time is tight; tighten it later.
4. Copy the Atlas SRV connection string.
5. Set this on `trustchain-backend`:

```text
MONGODB_URI=mongodb+srv://<atlas-user>:<atlas-password>@<atlas-cluster>/trustchain_ai?retryWrites=true&w=majority
```

## Polygon Amoy Integration

Use a deployer wallet with Amoy test MATIC. Prefer a separate backend writer wallet for runtime audit anchoring.

From `blockchain/`:

```powershell
npm install
npm run compile
$env:AMOY_RPC_URL="https://polygon-amoy.g.alchemy.com/v2/<api-key>"
$env:DEPLOYER_PRIVATE_KEY="0x<deployer-private-key>"
npm run deploy:amoy
```

Save:

```text
blockchain/deployments/amoy.json
```

Verify the deployed contract:

```powershell
$env:POLYGONSCAN_API_KEY="<polygonscan-api-key>"
npm run verify-contract:amoy -- <deployed-contract-address> <deployer-wallet-address>
```

Grant backend writer permission:

```powershell
$env:AUDIT_TRAIL_CONTRACT_ADDRESS="0x<deployed-contract-address>"
$env:BACKEND_WRITER_ADDRESS="0x<backend-writer-wallet-address>"
npm run grant-writer:amoy
```

Smoke test the live Amoy integration:

```powershell
$env:AUDIT_TRAIL_CONTRACT_ADDRESS="0x<deployed-contract-address>"
npm run smoke:amoy
```

Set these on `trustchain-backend`:

```text
AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/<api-key>
DEPLOYER_PRIVATE_KEY=0x<deployer-private-key>
BLOCKCHAIN_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/<api-key>
AUDIT_TRAIL_CONTRACT_ADDRESS=0x<deployed-contract-address>
BACKEND_WRITER_PRIVATE_KEY=0x<backend-writer-private-key>
```

## Railway Environment Variables

Do not manually set `PORT`; Railway injects it. All services must listen on `0.0.0.0` and the injected port.

### trustchain-backend

```text
NODE_ENV=production
MONGODB_URI=mongodb+srv://<atlas-user>:<atlas-password>@<atlas-cluster>/trustchain_ai?retryWrites=true&w=majority
CORS_ORIGINS=https://${{trustchain-frontend.RAILWAY_PUBLIC_DOMAIN}}

JWT_ACCESS_SECRET=<generate-64-plus-character-random-secret>
JWT_REFRESH_SECRET=<generate-different-64-plus-character-random-secret>
JWT_ISSUER=trustchain-ai
JWT_AUDIENCE=trustchain-ai-api
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_SECONDS=2592000

PASSWORD_BCRYPT_ROUNDS=12
TOTP_ISSUER=TrustChain AI
FIELD_ENCRYPTION_KEY_BASE64=<generate-32-byte-base64-key>

PASSWORD_RESET_TTL_SECONDS=900
BOOTSTRAP_DATABASE_ON_START=false

ML_SERVICE_URL=http://${{trustchain-ml-service.RAILWAY_PRIVATE_DOMAIN}}:${{trustchain-ml-service.PORT}}
ML_REQUEST_TIMEOUT_MS=5000
ML_REQUEST_RETRIES=2

BLOCKCHAIN_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/<api-key>
AUDIT_TRAIL_CONTRACT_ADDRESS=0x<deployed-contract-address>
BACKEND_WRITER_PRIVATE_KEY=0x<backend-writer-private-key>
```

Generate secrets locally:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Use different values for access JWT, refresh JWT, and field encryption.

### trustchain-ml-service

```text
ML_SERVICE_NAME=trustchain-ai-ml-service
ML_ENVIRONMENT=production
ML_MODEL_STORAGE_DIR=/app/storage/models
ML_TRAIN_ON_STARTUP=true
ML_SYNTHETIC_ROWS=5000
ML_CONTAMINATION=0.04
ML_RANDOM_STATE=42
```

The ML Dockerfile uses Railway's `PORT` automatically.

### trustchain-frontend

```text
NEXT_PUBLIC_API_BASE_URL=https://${{trustchain-backend.RAILWAY_PUBLIC_DOMAIN}}/api
NEXT_PUBLIC_ML_API_BASE_URL=https://${{trustchain-backend.RAILWAY_PUBLIC_DOMAIN}}/api
```

The frontend should not call the ML service directly in production. Browser traffic goes through the backend public API; backend-to-ML traffic stays on Railway private networking.

## Production Domain Configuration

1. Generate a Railway public domain for `trustchain-backend`.
2. Generate a Railway public domain for `trustchain-frontend`.
3. Leave `trustchain-ml-service` private unless temporary debugging requires a public domain.
4. Update `trustchain-backend`:

```text
CORS_ORIGINS=https://<frontend-domain>
```

5. Update `trustchain-frontend`:

```text
NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>/api
NEXT_PUBLIC_ML_API_BASE_URL=https://<backend-domain>/api
```

6. Redeploy backend first, then frontend.
7. If using a custom domain, add it in Railway Networking and create the DNS records Railway provides. Railway provisions HTTPS automatically.

Recommended final domains:

```text
Frontend: https://trustchain-ai.<your-domain>
Backend:  https://api-trustchain-ai.<your-domain>
ML:       private only
```

## Deployment Sequence

1. Push the latest code to GitHub.
2. Create the MongoDB Atlas cluster, user, and network access rule.
3. Create/fund Polygon Amoy deployer and backend writer wallets.
4. Deploy `AuditTrail.sol` to Polygon Amoy.
5. Grant the backend writer wallet on the deployed contract.
6. Create a Railway project named `trustchain-ai`.
7. Add `trustchain-ml-service` from the repo using the ML root directory.
8. Add ML environment variables and deploy it.
9. Confirm the ML deployment logs show Uvicorn listening on Railway's `PORT`.
10. Add `trustchain-backend` from the repo using the backend root directory.
11. Add backend environment variables, including Atlas, Amoy, and private ML URL.
12. Generate a public Railway domain for the backend.
13. Deploy backend and verify `/health`.
14. Seed required roles/demo data only if the judging environment needs demo accounts.
15. Add `trustchain-frontend` from the repo using the frontend root directory.
16. Generate a public Railway domain for the frontend.
17. Set frontend `NEXT_PUBLIC_*` variables using the backend public domain.
18. Update backend `CORS_ORIGINS` with the final frontend domain.
19. Redeploy backend, then frontend.
20. Configure custom domains if desired and repeat the CORS/frontend URL update with the custom domains.

## Final Validation Checklist

- [ ] `trustchain-ml-service` deploys successfully and responds to `/health` from inside Railway.
- [ ] `trustchain-backend` deploys successfully and public `/health` returns `200`.
- [ ] Backend logs show successful MongoDB Atlas connection.
- [ ] Backend logs show no ML client URL or private DNS resolution errors.
- [ ] Frontend Railway domain loads `/login`.
- [ ] Browser login/register requests go to `https://<backend-domain>/api`.
- [ ] Backend CORS allows the final frontend domain and rejects unrelated origins.
- [ ] Required roles and demo users exist in Atlas.
- [ ] Login creates a session document in Atlas.
- [ ] Risk evaluation reaches the ML service and stores an ML prediction.
- [ ] High-risk or audit event records an Amoy transaction hash.
- [ ] `POST /api/blockchain-audit/verify` validates a recorded audit hash.
- [ ] No real secrets are committed to Git.
- [ ] Ganache private keys are not used on Amoy.
- [ ] `BOOTSTRAP_DATABASE_ON_START=false` after initial seeding.

## References

- Railway private networking: services can reach each other through internal DNS inside one project environment.
- Railway public networking: public domains and custom domains are configured per service.
- Railway variables: `RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_PRIVATE_DOMAIN`, and `PORT` are injected by Railway.
