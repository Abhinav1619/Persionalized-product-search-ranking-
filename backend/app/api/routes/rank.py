from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.ranking import RankRequest, RankResponse
from app.services.ranking_service import rank_products

router = APIRouter(prefix="/api", tags=["ranking"])


@router.post("/rank", response_model=RankResponse)
def rank(request: RankRequest, db: Session = Depends(get_db)) -> RankResponse:
    result = rank_products(db, request, include_pipeline=True)
    return RankResponse(**result)