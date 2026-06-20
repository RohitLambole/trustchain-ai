import logging

from app.data.synthetic_dataset import SyntheticDatasetGenerator
from app.registry.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


class TrainingService:
    def __init__(self, registry: ModelRegistry, generator: SyntheticDatasetGenerator) -> None:
        self.registry = registry
        self.generator = generator

    def train_missing_models(self) -> None:
        loaded_count = self.registry.load_all()
        if loaded_count == self.registry.expected_count():
            logger.info("all_models_loaded", extra={"loaded_count": loaded_count})
            return

        for key, model in self.registry.models.items():
            if model.loaded:
                continue

            if key == "login":
                frame = self.generator.login_behavior()
            elif key == "recovery":
                frame = self.generator.recovery_fraud()
            elif key == "insider":
                frame = self.generator.insider_threat()
            else:
                raise ValueError(f"Unknown model key: {key}")

            model.train(frame)
            self.registry.save(key)
            logger.info("model_trained", extra={"model_name": model.model_name, "rows": len(frame)})
