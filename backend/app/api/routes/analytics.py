from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.ml.model_loader import model_registry
from app.services.analytics_service import overview, ranking_analytics

router = APIRouter(prefix="/api", tags=["analytics"])


@router.get("/analytics/overview")
def analytics_overview(db: Session = Depends(get_db)) -> dict:
    return overview(db)


@router.get("/analytics/ranking")
def analytics_ranking(db: Session = Depends(get_db)) -> dict:
    return ranking_analytics(db)


@router.get("/models/status")
def models_status() -> dict:
    return model_registry.status()


@router.get("/health")
def health() -> dict:
    status = model_registry.status()
    return {
        "status": "ok",
        "app": "RankWise AI",
        "semantic_ready": status["semantic"].get("ready", False),
        "mmoe_status": status["mmoe"]["status"],
    }