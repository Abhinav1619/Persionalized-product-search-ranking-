from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.ranking import RankRequest, RankResponse
from app.services.lab_history_service import save_lab_run
from app.services.ranking_service import rank_products

router = APIRouter(prefix="/api", tags=["ranking"])


@router.post("/rank", response_model=RankResponse)
def rank(request: RankRequest, db: Session = Depends(get_db)) -> RankResponse:
    result = rank_products(db, request, include_pipeline=True)
    history = save_lab_run(
        {
            **result,
            "user_id": request.user_id,
        }
    )
    result["history_id"] = history["id"]
    return RankResponse(**result)
