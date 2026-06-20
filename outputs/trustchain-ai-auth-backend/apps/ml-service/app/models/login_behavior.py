from app.features.login_features import LoginFeatureBuilder
from app.models.base import BaseIsolationForestModel


class LoginBehaviorIsolationForest(BaseIsolationForestModel):
    model_name = "login_behavior_isolation_forest"
    feature_names = LoginFeatureBuilder.feature_names
