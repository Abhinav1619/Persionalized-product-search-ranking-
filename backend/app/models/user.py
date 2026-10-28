from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    preferred_categories_json: Mapped[str] = mapped_column(Text, default="[]")
    preferred_brands_json: Mapped[str] = mapped_column(Text, default="[]")
    preferred_attributes_json: Mapped[str] = mapped_column(Text, default="[]")
    browsing_interests_json: Mapped[str] = mapped_column(Text, default="[]")
    recent_interactions_json: Mapped[str] = mapped_column(Text, default="[]")
    price_sensitivity: Mapped[float] = mapped_column(Float, default=0.5)
    personalization_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)