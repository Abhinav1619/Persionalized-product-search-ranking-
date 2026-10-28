from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.events import EventCreate, EventOut
from app.services.event_service import record_event

router = APIRouter(prefix="/api", tags=["events"])


@router.post("/events", response_model=EventOut)
def create_event(payload: EventCreate, db: Session = Depends(get_db)) -> EventOut:
    return record_event(db, payload)