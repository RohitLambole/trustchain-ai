from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "trustchain-ai-ml-service"
    environment: str = "development"
    model_storage_dir: Path = Path("storage/models")
    train_on_startup: bool = True
    synthetic_rows: int = 5000
    contamination: float = 0.04
    random_state: int = 42

    model_config = SettingsConfigDict(env_prefix="ML_", env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.model_storage_dir.mkdir(parents=True, exist_ok=True)
    return settings
