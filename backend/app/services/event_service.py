from __future__ import annotations

import json

from sqlalchemy.orm import Session

from app.models.interaction import InteractionEvent
from app.schemas.events import EventCreate, EventOut


def record_event(db: Session, payload: EventCreate) -> EventOut:
    row = InteractionEvent(
        event_type=payload.event_type,
        user_id=payload.user_id,
        product_id=payload.product_id,
        query=payload.query,
        metadata_json=json.dumps(payload.metadata or {}),
        is_demo=payload.is_demo,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return EventOut.model_validate(row)
