from fastapi import APIRouter, Depends

from app.api.dependencies import get_registry
from app.registry.model_registry import ModelRegistry
from app.schemas.prediction import ModelInfo

router = APIRouter(tags=["models"])


@router.get("/models", response_model=list[ModelInfo])
def list_models(registry: ModelRegistry = Depends(get_registry)) -> list[ModelInfo]:
    return [ModelInfo(**metadata.__dict__) for metadata in registry.list_models()]
