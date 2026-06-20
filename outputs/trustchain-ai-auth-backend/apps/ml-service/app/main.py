from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dependencies import get_registry
from app.api.routes.health import router as health_router
from app.api.routes.models import router as models_router
from app.api.routes.predict import router as predict_router
from app.core.config import get_settings
from app.core.logging import configure_logging


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    get_registry()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="TrustChain AI ML Service",
        description="Isolation Forest anomaly detection for banking identity risk.",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.environment != "production" else [],
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(models_router)
    app.include_router(predict_router)
    return app


app = create_app()
