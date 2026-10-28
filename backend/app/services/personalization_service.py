from __future__ import annotations

import json
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import UserProfile
from app.schemas.user import UserPreferences, UserPreferencesUpdate


def _prefs_from_row(row: UserProfile) -> UserPreferences:
    return UserPreferences(
        user_id=row.id,
        display_name=row.display_name,
        preferred_categories=json.loads(row.preferred_categories_json or "[]"),
        preferred_brands=json.loads(row.preferred_brands_json or "[]"),
        preferred_attributes=json.loads(row.preferred_attributes_json or "[]"),
        browsing_interests=json.loads(row.browsing_interests_json or "[]"),
        recent_interactions=json.loads(row.recent_interactions_json or "[]"),
        price_sensitivity=row.price_sensitivity,
        personalization_enabled=row.personalization_enabled,
    )


def get_user_preferences(db: Session, user_id: str) -> UserPreferences:
    row = db.get(UserProfile, user_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")
    return _prefs_from_row(row)


def list_demo_users(db: Session) -> list[UserPreferences]:
    rows = db.query(UserProfile).order_by(UserProfile.display_name).all()
    return [_prefs_from_row(r) for r in rows]


def update_user_preferences(db: Session, user_id: str, payload: UserPreferencesUpdate) -> UserPreferences:
    row = db.get(UserProfile, user_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

    data = payload.model_dump(exclude_unset=True)
    mapping = {
        "preferred_categories": "preferred_categories_json",
        "preferred_brands": "preferred_brands_json",
        "preferred_attributes": "preferred_attributes_json",
        "browsing_interests": "browsing_interests_json",
        "recent_interactions": "recent_interactions_json",
    }
    for field, value in data.items():
        if field in mapping:
            setattr(row, mapping[field], json.dumps(value))
        elif field == "display_name":
            row.display_name = value
        elif field == "price_sensitivity":
            row.price_sensitivity = value
        elif field == "personalization_enabled":
            row.personalization_enabled = value

    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _prefs_from_row(row)


def user_dict(prefs: UserPreferences) -> dict:
    return prefs.model_dump()
