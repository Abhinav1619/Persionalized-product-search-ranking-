from typing import Any

from pydantic import BaseModel, Field


class ProductOut(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    subcategory: str = ""
    description: str = ""
    price: float
    original_price: float | None = None
    discount_percent: float | None = None
    rating: float
    review_count: int
    popularity: float
    image_url: str
    attributes: dict[str, Any] = Field(default_factory=dict)
    specs: dict[str, Any] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int
    categories: list[str] = Field(default_factory=list)
    brands: list[str] = Field(default_factory=list)