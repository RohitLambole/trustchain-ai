from app.features.insider_features import InsiderFeatureBuilder
from app.models.base import BaseIsolationForestModel


class InsiderThreatIsolationForest(BaseIsolationForestModel):
    model_name = "insider_threat_isolation_forest"
    feature_names = InsiderFeatureBuilder.feature_names
