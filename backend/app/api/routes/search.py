from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.events import EventCreate
from app.schemas.search import AutocompleteResponse, SearchRequest, SearchResponse
from app.services.event_service import record_event
from app.services.search_service import autocomplete, search_products

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search/autocomplete", response_model=AutocompleteResponse)
def search_autocomplete(q: str = Query("")) -> AutocompleteResponse:
    data = autocomplete(q)
    return AutocompleteResponse(**data)


@router.post("/search", response_model=SearchResponse)
def search(request: SearchRequest, db: Session = Depends(get_db)) -> SearchResponse:
    result = search_products(db, request)
    record_event(
        db,
        EventCreate(
            event_type="search",
            user_id=request.user_id,
            query=request.query,
            metadata={"ranking_mode": request.ranking_mode},
            is_demo=True,
        ),
    )
    return SearchResponse(**result)