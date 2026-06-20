from app.features.insider_features import InsiderFeatureBuilder
from app.features.login_features import LoginFeatureBuilder
from app.features.recovery_features import RecoveryFeatureBuilder
from app.registry.model_registry import ModelRegistry
from app.schemas.prediction import (
    InsiderRiskRequest,
    LoginRiskRequest,
    PredictionResponse,
    RecoveryRiskRequest,
    RiskLevel,
)
from app.services.explanation_service import ExplanationService


class PredictionService:
    def __init__(self, registry: ModelRegistry) -> None:
        self.registry = registry
        self.explainer = ExplanationService()
        self.login_features = LoginFeatureBuilder()
        self.recovery_features = RecoveryFeatureBuilder()
        self.insider_features = InsiderFeatureBuilder()

    def predict_login(self, payload: LoginRiskRequest) -> PredictionResponse:
        model = self.registry.get("login")
        score, is_anomaly = model.predict_score(self.login_features.build_one(payload))
        return self.response(model.model_name, model.model_version, score, is_anomaly, self.explainer.login(payload))

    def predict_recovery(self, payload: RecoveryRiskRequest) -> PredictionResponse:
        model = self.registry.get("recovery")
        score, is_anomaly = model.predict_score(self.recovery_features.build_one(payload))
        return self.response(model.model_name, model.model_version, score, is_anomaly, self.explainer.recovery(payload))

    def predict_insider(self, payload: InsiderRiskRequest) -> PredictionResponse:
        model = self.registry.get("insider")
        score, is_anomaly = model.predict_score(self.insider_features.build_one(payload))
        return self.response(model.model_name, model.model_version, score, is_anomaly, self.explainer.insider(payload))

    def response(
        self,
        model_name: str,
        model_version: str,
        anomaly_score: float,
        is_anomaly: bool,
        explanation: list[str],
    ) -> PredictionResponse:
        return PredictionResponse(
            anomaly_score=anomaly_score,
            is_anomaly=is_anomaly,
            risk_level=self.risk_level(anomaly_score),
            explanation=explanation,
            model_name=model_name,
            model_version=model_version,
        )

    def risk_level(self, anomaly_score: float) -> RiskLevel:
        if anomaly_score >= 0.9:
            return RiskLevel.CRITICAL
        if anomaly_score >= 0.65:
            return RiskLevel.HIGH
        if anomaly_score >= 0.35:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW
