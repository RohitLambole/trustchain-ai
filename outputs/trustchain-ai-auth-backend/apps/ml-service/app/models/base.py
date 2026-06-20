from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


@dataclass
class ModelMetadata:
    model_name: str
    model_version: str
    model_type: str
    feature_names: list[str]
    trained_at: str | None
    model_path: str
    loaded: bool


class BaseIsolationForestModel:
    model_name: str
    model_version = "1.0.0"
    feature_names: list[str]

    def __init__(self, contamination: float, random_state: int) -> None:
        self.model = IsolationForest(
            n_estimators=300,
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1,
        )
        self.trained_at: str | None = None
        self.loaded = False

    def train(self, frame: pd.DataFrame) -> None:
        self.model.fit(frame[self.feature_names])
        self.trained_at = datetime.now(UTC).isoformat()
        self.loaded = True

    def predict_score(self, frame: pd.DataFrame) -> tuple[float, bool]:
        raw_score = float(self.model.decision_function(frame[self.feature_names])[0])
        prediction = int(self.model.predict(frame[self.feature_names])[0])
        anomaly_score = float(np.clip(1.0 - ((raw_score + 0.25) / 0.5), 0.0, 1.0))
        return round(anomaly_score, 4), prediction == -1 or anomaly_score >= 0.65

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {
                "model": self.model,
                "trained_at": self.trained_at,
                "model_name": self.model_name,
                "model_version": self.model_version,
                "feature_names": self.feature_names,
            },
            path,
        )

    def load(self, path: Path) -> bool:
        if not path.exists():
            return False
        artifact = joblib.load(path)
        self.model = artifact["model"]
        self.trained_at = artifact.get("trained_at")
        self.loaded = True
        return True

    def metadata(self, path: Path) -> ModelMetadata:
        return ModelMetadata(
            model_name=self.model_name,
            model_version=self.model_version,
            model_type="IsolationForest",
            feature_names=self.feature_names,
            trained_at=self.trained_at,
            model_path=str(path),
            loaded=self.loaded,
        )
