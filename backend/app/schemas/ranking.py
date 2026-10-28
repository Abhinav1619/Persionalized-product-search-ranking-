from typing import Any, Literal

from pydantic import BaseModel, Field


RankingMode = Literal[
    "personalized",
    "relevance",
    "price_asc",
    "price_desc",
    "rating",
    "popularity",
]


class RankingExplanation(BaseModel):
    semantic_similarity: float
    structured_contribution: float
    user_preference_contribution: float
    click_probability: float
    atc_probability: float
    purchase_probability: float
    final_score: float
    scoring_method: str
    model_status: str
    why_this_result: str
    details: dict[str, Any] = Field(default_factory=dict)


class RankedProduct(BaseModel):
    product: dict[str, Any]
    rank: int
    score: float
    explanation: RankingExplanation


class RankRequest(BaseModel):
    query: str = ""
    product_ids: list[str] | None = None
    user_id: str = "demo-fitness"
    ranking_mode: RankingMode = "personalized"
    personalization_enabled: bool | None = None
    top_k: int = 20


class RankResponse(BaseModel):
    query: str
    ranking_mode: RankingMode
    personalization_enabled: bool
    scoring_method: str
    model_status: str
    results: list[RankedProduct]
    pd_at_k: float | None = None
    comparison: dict[str, Any] | None = None
    pipeline: dict[str, Any] | None = None
    intent: dict[str, Any] | None = None
    filtered_count: int | None = None
    candidate_count_before_intent: int | None = None
    history_id: str | None = None