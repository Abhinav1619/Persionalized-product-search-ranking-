from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.ranking import RankingExplanation, RankingMode


class SearchFilters(BaseModel):
    category: str | None = None
    brand: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    min_rating: float | None = None


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    user_id: str = "demo-fitness"
    ranking_mode: RankingMode = "personalized"
    personalization_enabled: bool | None = None
    filters: SearchFilters = Field(default_factory=SearchFilters)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=12, ge=1, le=50)
    include_explanations: bool = True


class SearchResultItem(BaseModel):
    product: dict[str, Any]
    rank: int
    score: float
    explanation: RankingExplanation | None = None


class SearchResponse(BaseModel):
    query: str
    ranking_mode: RankingMode
    personalization_enabled: bool
    scoring_method: str
    model_status: str
    total: int
    page: int
    page_size: int
    results: list[SearchResultItem]
    suggestions: list[str] = Field(default_factory=list)
    facets: dict[str, Any] = Field(default_factory=dict)


class AutocompleteResponse(BaseModel):
    suggestions: list[str]
    popular_queries: list[str]