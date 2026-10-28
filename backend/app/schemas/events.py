from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


EventType = Literal["impression", "click", "atc", "purchase", "wishlist", "search"]


class EventCreate(BaseModel):
    event_type: EventType
    user_id: str = "demo-guest"
    product_id: str | None = None
    query: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    is_demo: bool = True


class EventOut(BaseModel):
    id: int
    event_type: str
    user_id: str
    product_id: str | None
    query: str | None
    is_demo: bool
    created_at: datetime

    model_config = {"from_attributes": True}