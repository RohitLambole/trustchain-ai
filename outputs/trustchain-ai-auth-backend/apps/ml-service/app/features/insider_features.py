import pandas as pd

from app.features.base import FeatureBuilder
from app.schemas.prediction import InsiderRiskRequest


class InsiderFeatureBuilder(FeatureBuilder):
    feature_names = [
        "access_hour",
        "records_accessed_1h",
        "privileged_action_count_24h",
        "after_hours_access",
        "peer_deviation_score",
        "failed_admin_actions_24h",
        "sensitive_case_access",
    ]

    def build_one(self, payload: InsiderRiskRequest) -> pd.DataFrame:
        return self.frame_from_records([payload.model_dump()])
