from fastapi import APIRouter, Depends

from app.api.dependencies import get_prediction_service
from app.schemas.prediction import InsiderRiskRequest, LoginRiskRequest, PredictionResponse, RecoveryRiskRequest
from app.services.prediction_service import PredictionService

router = APIRouter(prefix="/predict", tags=["prediction"])


@router.post("/login-risk", response_model=PredictionResponse)
def predict_login_risk(
    payload: LoginRiskRequest,
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionResponse:
    return service.predict_login(payload)


@router.post("/recovery-risk", response_model=PredictionResponse)
def predict_recovery_risk(
    payload: RecoveryRiskRequest,
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionResponse:
    return service.predict_recovery(payload)


@router.post("/insider-risk", response_model=PredictionResponse)
def predict_insider_risk(
    payload: InsiderRiskRequest,
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionResponse:
    return service.predict_insider(payload)
