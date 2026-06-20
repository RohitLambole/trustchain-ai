from fastapi import APIRouter, Depends

from app.api.dependencies import get_registry
from app.core.config import get_settings
from app.registry.model_registry import ModelRegistry
from app.schemas.prediction import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(registry: ModelRegistry = Depends(get_registry)) -> HealthResponse:
    loaded = registry.loaded_count()
    expected = registry.expected_count()
    return HealthResponse(
        status="ok" if loaded == expected else "degraded",
        service=get_settings().service_name,
        models_loaded=loaded,
        models_expected=expected,
    )
