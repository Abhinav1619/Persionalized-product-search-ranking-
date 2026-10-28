from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserPreferences, UserPreferencesUpdate
from app.services.personalization_service import (
    get_user_preferences,
    list_demo_users,
    update_user_preferences,
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserPreferences])
def list_users(db: Session = Depends(get_db)) -> list[UserPreferences]:
    return list_demo_users(db)


@router.get("/{user_id}/preferences", response_model=UserPreferences)
def read_preferences(user_id: str, db: Session = Depends(get_db)) -> UserPreferences:
    return get_user_preferences(db, user_id)


@router.put("/{user_id}/preferences", response_model=UserPreferences)
def write_preferences(
    user_id: str,
    payload: UserPreferencesUpdate,
    db: Session = Depends(get_db),
) -> UserPreferences:
    return update_user_preferences(db, user_id, payload)