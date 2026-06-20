import numpy as np
import pandas as pd


class SyntheticDatasetGenerator:
    def __init__(self, rows: int, random_state: int) -> None:
        self.rows = rows
        self.rng = np.random.default_rng(random_state)

    def login_behavior(self) -> pd.DataFrame:
        rows = self.rows
        normal_hours = self.rng.choice([8, 9, 10, 11, 14, 15, 16, 18, 19], size=rows)
        data = pd.DataFrame(
            {
                "login_hour": normal_hours,
                "failed_attempts": self.rng.poisson(0.4, rows),
                "device_age_days": self.rng.gamma(8, 25, rows).clip(1, 1000),
                "device_changes_30d": self.rng.poisson(0.5, rows),
                "geo_change": self.rng.binomial(1, 0.05, rows),
                "trust_score": self.rng.normal(82, 10, rows).clip(20, 100),
            }
        )
        return data.astype(float)

    def recovery_fraud(self) -> pd.DataFrame:
        rows = self.rows
        data = pd.DataFrame(
            {
                "recovery_hour": self.rng.choice([9, 10, 11, 13, 14, 15, 16, 17], size=rows),
                "failed_recovery_attempts_7d": self.rng.poisson(0.2, rows),
                "contact_change_24h": self.rng.binomial(1, 0.03, rows),
                "new_device": self.rng.binomial(1, 0.08, rows),
                "geo_change": self.rng.binomial(1, 0.06, rows),
                "account_age_days": self.rng.gamma(12, 80, rows).clip(1, 8000),
                "trust_score": self.rng.normal(80, 12, rows).clip(10, 100),
            }
        )
        return data.astype(float)

    def insider_threat(self) -> pd.DataFrame:
        rows = self.rows
        data = pd.DataFrame(
            {
                "access_hour": self.rng.choice([8, 9, 10, 11, 12, 13, 14, 15, 16, 17], size=rows),
                "records_accessed_1h": self.rng.gamma(3, 12, rows).clip(1, 500),
                "privileged_action_count_24h": self.rng.poisson(3, rows),
                "after_hours_access": self.rng.binomial(1, 0.04, rows),
                "peer_deviation_score": self.rng.normal(20, 10, rows).clip(0, 100),
                "failed_admin_actions_24h": self.rng.poisson(0.3, rows),
                "sensitive_case_access": self.rng.binomial(1, 0.08, rows),
            }
        )
        return data.astype(float)
