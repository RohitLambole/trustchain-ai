from app.features.recovery_features import RecoveryFeatureBuilder
from app.models.base import BaseIsolationForestModel


class RecoveryIsolationForest(BaseIsolationForestModel):
    model_name = "recovery_isolation_forest"
    feature_names = RecoveryFeatureBuilder.feature_names
