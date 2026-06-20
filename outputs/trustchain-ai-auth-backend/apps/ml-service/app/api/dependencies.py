from functools import lru_cache

from app.core.config import get_settings
from app.data.synthetic_dataset import SyntheticDatasetGenerator
from app.registry.model_registry import ModelRegistry
from app.services.prediction_service import PredictionService
from app.services.training_service import TrainingService


@lru_cache
def get_registry() -> ModelRegistry:
    settings = get_settings()
    registry = ModelRegistry(settings)
    if settings.train_on_startup:
        generator = SyntheticDatasetGenerator(settings.synthetic_rows, settings.random_state)
        TrainingService(registry, generator).train_missing_models()
    else:
        registry.load_all()
    return registry


def get_prediction_service() -> PredictionService:
    return PredictionService(get_registry())
