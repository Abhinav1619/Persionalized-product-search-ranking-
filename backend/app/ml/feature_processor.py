"""Structured feature construction for ranking."""

from __future__ import annotations

from typing import Any

import numpy as np


def product_document(product: dict[str, Any]) -> str:
    parts = [
        product.get("name", ""),
        product.get("brand", ""),
        product.get("category", ""),
        product.get("subcategory", ""),
        product.get("description", ""),
        " ".join(product.get("tags", []) or []),
    ]
    attrs = product.get("attributes") or {}
    parts.extend(str(v) for v in attrs.values())
    return " ".join(p for p in parts if p)


def structured_vector(
    product: dict[str, Any],
    user: dict[str, Any] | None,
    semantic_sim: float,
    personalization: bool,
) -> dict[str, float]:
    price = float(product.get("price") or 0)
    rating = float(product.get("rating") or 0)
    popularity = float(product.get("popularity") or 0)
    reviews = float(product.get("review_count") or 0)

    price_norm = min(price / 100000.0, 1.0)
    rating_norm = rating / 5.0
    review_norm = min(reviews / 10000.0, 1.0)

    category_pref = 0.0
    brand_pref = 0.0
    attr_pref = 0.0
    history_boost = 0.0
    price_fit = 0.5

    if personalization and user:
        cats = {c.lower() for c in user.get("preferred_categories", [])}
        brands = {b.lower() for b in user.get("preferred_brands", [])}
        attrs = {a.lower() for a in user.get("preferred_attributes", [])}
        interests = {i.lower() for i in user.get("browsing_interests", [])}
        recent = set(user.get("recent_interactions", []))
        sensitivity = float(user.get("price_sensitivity", 0.5))

        if product.get("category", "").lower() in cats:
            category_pref = 1.0
        if product.get("brand", "").lower() in brands:
            brand_pref = 1.0

        blob = " ".join(
            [
                product.get("name", ""),
                product.get("description", ""),
                " ".join(product.get("tags", []) or []),
                " ".join(str(v) for v in (product.get("attributes") or {}).values()),
            ]
        ).lower()
        hits = sum(1 for a in attrs if a in blob)
        attr_pref = min(hits / max(len(attrs), 1), 1.0) if attrs else 0.0
        interest_hits = sum(1 for i in interests if i in blob)
        attr_pref = max(attr_pref, min(interest_hits / max(len(interests), 1), 1.0) if interests else 0.0)

        if product.get("id") in recent:
            history_boost = 0.35

        # Higher sensitivity prefers cheaper items
        price_fit = 1.0 - abs(price_norm - (1.0 - sensitivity))

    structured_score = (
        0.25 * rating_norm
        + 0.20 * popularity
        + 0.15 * review_norm
        + 0.15 * (1.0 - price_norm)
        + 0.25 * semantic_sim
    )

    user_score = 0.0
    if personalization and user:
        user_score = (
            0.30 * category_pref
            + 0.25 * brand_pref
            + 0.25 * attr_pref
            + 0.10 * history_boost
            + 0.10 * price_fit
        )

    return {
        "price_norm": price_norm,
        "rating_norm": rating_norm,
        "popularity": popularity,
        "review_norm": review_norm,
        "semantic_sim": semantic_sim,
        "category_pref": category_pref,
        "brand_pref": brand_pref,
        "attr_pref": attr_pref,
        "history_boost": history_boost,
        "price_fit": price_fit,
        "structured_score": float(np.clip(structured_score, 0, 1)),
        "user_score": float(np.clip(user_score, 0, 1)),
    }


def features_to_array(features: dict[str, float]) -> np.ndarray:
    keys = [
        "price_norm",
        "rating_norm",
        "popularity",
        "review_norm",
        "semantic_sim",
        "category_pref",
        "brand_pref",
        "attr_pref",
        "history_boost",
        "price_fit",
    ]
    return np.array([features.get(k, 0.0) for k in keys], dtype=np.float32)
