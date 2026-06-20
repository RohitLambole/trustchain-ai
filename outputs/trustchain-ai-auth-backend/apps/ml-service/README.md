# TrustChain AI ML Service

FastAPI microservice for Isolation Forest anomaly detection.

## Models

- Login behavior risk
- Account recovery fraud
- Insider threat detection

## Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The service trains synthetic baseline models on startup when persisted model files are missing.

## Endpoints

```text
GET  /health
GET  /models
POST /predict/login-risk
POST /predict/recovery-risk
POST /predict/insider-risk
```

## Docker

From the backend root:

```bash
docker compose up --build ml-service
```

Example login-risk request:

```json
{
  "login_hour": 2,
  "failed_attempts": 8,
  "device_age_days": 1,
  "device_changes_30d": 4,
  "geo_change": 1,
  "trust_score": 25
}
```

Example response:

```json
{
  "anomaly_score": 0.91,
  "is_anomaly": true,
  "risk_level": "HIGH",
  "explanation": ["new_device", "multiple_failed_logins", "geo_change"],
  "model_name": "login_behavior_isolation_forest",
  "model_version": "1.0.0"
}
```
