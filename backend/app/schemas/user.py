from pydantic import BaseModel, Field


class UserPreferences(BaseModel):
    user_id: str
    display_name: str
    preferred_categories: list[str] = Field(default_factory=list)
    preferred_brands: list[str] = Field(default_factory=list)
    preferred_attributes: list[str] = Field(default_factory=list)
    browsing_interests: list[str] = Field(default_factory=list)
    recent_interactions: list[str] = Field(default_factory=list)
    price_sensitivity: float = Field(default=0.5, ge=0.0, le=1.0)
    personalization_enabled: bool = True


class UserPreferencesUpdate(BaseModel):
    display_name: str | None = None
    preferred_categories: list[str] | None = None
    preferred_brands: list[str] | None = None
    preferred_attributes: list[str] | None = None
    browsing_interests: list[str] | None = None
    recent_interactions: list[str] | None = None
    price_sensitivity: float | None = Field(default=None, ge=0.0, le=1.0)
    personalization_enabled: bool | None = None