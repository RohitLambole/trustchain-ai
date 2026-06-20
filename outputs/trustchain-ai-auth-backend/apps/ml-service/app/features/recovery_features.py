import pandas as pd

from app.features.base import FeatureBuilder
from app.schemas.prediction import RecoveryRiskRequest


class RecoveryFeatureBuilder(FeatureBuilder):
    feature_names = [
        "recovery_hour",
        "failed_recovery_attempts_7d",
        "contact_change_24h",
        "new_device",
        "geo_change",
        "account_age_days",
        "trust_score",
    ]

    def build_one(self, payload: RecoveryRiskRequest) -> pd.DataFrame:
        return self.frame_from_records([payload.model_dump()])
