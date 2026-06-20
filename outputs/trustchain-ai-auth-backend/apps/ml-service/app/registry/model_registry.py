from pathlib import Path

from app.core.config import Settings
from app.models.base import BaseIsolationForestModel, ModelMetadata
from app.models.insider_threat import InsiderThreatIsolationForest
from app.models.login_behavior import LoginBehaviorIsolationForest
from app.models.recovery import RecoveryIsolationForest


class ModelRegistry:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.models: dict[str, BaseIsolationForestModel] = {
            "login": LoginBehaviorIsolationForest(settings.contamination, settings.random_state),
            "recovery": RecoveryIsolationForest(settings.contamination, settings.random_state + 1),
            "insider": InsiderThreatIsolationForest(settings.contamination, settings.random_state + 2),
        }

    def path_for(self, key: str) -> Path:
        return self.settings.model_storage_dir / f"{self.models[key].model_name}.joblib"

    def get(self, key: str) -> BaseIsolationForestModel:
        return self.models[key]

    def load_all(self) -> int:
        loaded = 0
        for key, model in self.models.items():
            if model.load(self.path_for(key)):
                loaded += 1
        return loaded

    def save(self, key: str) -> None:
        self.models[key].save(self.path_for(key))

    def list_models(self) -> list[ModelMetadata]:
        return [model.metadata(self.path_for(key)) for key, model in self.models.items()]

    def loaded_count(self) -> int:
        return sum(1 for model in self.models.values() if model.loaded)

    def expected_count(self) -> int:
        return len(self.models)
