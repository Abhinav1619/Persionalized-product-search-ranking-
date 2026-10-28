from __future__ import annotations

import json
from typing import Any

from app.models.product import Product


def serialize_product(product: Product) -> dict[str, Any]:
    original = product.original_price
    discount = None
    if original and original > product.price:
        discount = round((1 - product.price / original) * 100, 1)
    return {
        "id": product.id,
        "name": product.name,
        "brand": product.brand,
        "category": product.category,
        "subcategory": product.subcategory,
        "description": product.description,
        "price": product.price,
        "original_price": original,
        "discount_percent": discount,
        "rating": product.rating,
        "review_count": product.review_count,
        "popularity": product.popularity,
        "image_url": product.image_url,
        "attributes": json.loads(product.attributes_json or "{}"),
        "specs": json.loads(product.specs_json or "{}"),
        "tags": json.loads(product.tags_json or "[]"),
    }