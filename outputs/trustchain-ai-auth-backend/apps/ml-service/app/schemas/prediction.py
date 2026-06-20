from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, Field


class RiskLevel(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


Score01 = Annotated[float, Field(ge=0.0, le=1.0)]


class LoginRiskRequest(BaseModel):
    login_hour: Annotated[int, Field(ge=0, le=23)]
    failed_attempts: Annotated[int, Field(ge=0, le=100)]
    device_age_days: Annotated[int, Field(ge=0, le=3650)]
    device_changes_30d: Annotated[int, Field(ge=0, le=100)]
    geo_change: Annotated[int, Field(ge=0, le=1)]
    trust_score: Annotated[float, Field(ge=0, le=100)]


class RecoveryRiskRequest(BaseModel):
    recovery_hour: Annotated[int, Field(ge=0, le=23)]
    failed_recovery_attempts_7d: Annotated[int, Field(ge=0, le=100)]
    contact_change_24h: Annotated[int, Field(ge=0, le=1)]
    new_device: Annotated[int, Field(ge=0, le=1)]
    geo_change: Annotated[int, Field(ge=0, le=1)]
    account_age_days: Annotated[int, Field(ge=0, le=36500)]
    trust_score: Annotated[float, Field(ge=0, le=100)]


class InsiderRiskRequest(BaseModel):
    access_hour: Annotated[int, Field(ge=0, le=23)]
    records_accessed_1h: Annotated[int, Field(ge=0, le=100000)]
    privileged_action_count_24h: Annotated[int, Field(ge=0, le=10000)]
    after_hours_access: Annotated[int, Field(ge=0, le=1)]
    peer_deviation_score: Annotated[float, Field(ge=0, le=100)]
    failed_admin_actions_24h: Annotated[int, Field(ge=0, le=1000)]
    sensitive_case_access: Annotated[int, Field(ge=0, le=1)]


class PredictionResponse(BaseModel):
    anomaly_score: Score01
    is_anomaly: bool
    risk_level: RiskLevel
    explanation: list[str]
    model_name: str
    model_version: str


class ModelInfo(BaseModel):
    model_name: str
    model_version: str
    model_type: str
    feature_names: list[str]
    trained_at: str | None
    model_path: str
    loaded: bool


class HealthResponse(BaseModel):
    status: str
    service: str
    models_loaded: int
    models_expected: int
