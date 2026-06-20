import pandas as pd

from app.features.base import FeatureBuilder
from app.schemas.prediction import LoginRiskRequest


class LoginFeatureBuilder(FeatureBuilder):
    feature_names = [
        "login_hour",
        "failed_attempts",
        "device_age_days",
        "device_changes_30d",
        "geo_change",
        "trust_score",
    ]

    def build_one(self, payload: LoginRiskRequest) -> pd.DataFrame:
        return self.frame_from_records([payload.model_dump()])
