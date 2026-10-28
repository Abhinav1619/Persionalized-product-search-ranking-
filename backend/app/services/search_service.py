from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.ml.ranker import ranker
from app.models.product import Product
from app.schemas.search import SearchFilters, SearchRequest
from app.services.personalization_service import get_user_preferences, user_dict
from app.services.product_serializer import serialize_product

POPULAR_QUERIES = [
    "wireless headphones for gym under ₹5000",
    "comfortable running shoes for beginners",
    "lightweight laptop for programming",
    "skincare products for oily skin",
    "formal shoes for office wear",
]


def _apply_filters(products: list[dict[str, Any]], filters: SearchFilters) -> list[dict[str, Any]]:
    out = products
    if filters.category:
        out = [p for p in out if p["category"].lower() == filters.category.lower()]
    if filters.brand:
        out = [p for p in out if p["brand"].lower() == filters.brand.lower()]
    if filters.min_price is not None:
        out = [p for p in out if p["price"] >= filters.min_price]
    if filters.max_price is not None:
        out = [p for p in out if p["price"] <= filters.max_price]
    if filters.min_rating is not None:
        out = [p for p in out if p["rating"] >= filters.min_rating]
    return out


def autocomplete(query: str) -> dict[str, list[str]]:
    q = query.strip().lower()
    suggestions = [s for s in POPULAR_QUERIES if q in s.lower()] if q else POPULAR_QUERIES[:]
    # Also suggest category-ish expansions
    extras = [
        f"{q} under ₹5000" if q and "₹" not in q else None,
        f"best {q}" if q else None,
    ]
    for e in extras:
        if e and e not in suggestions:
            suggestions.append(e)
    return {"suggestions": suggestions[:8], "popular_queries": POPULAR_QUERIES}


def search_products(db: Session, request: SearchRequest) -> dict[str, Any]:
    rows = db.query(Product).all()
    products = [serialize_product(r) for r in rows]
    products = _apply_filters(products, request.filters)

    prefs = get_user_preferences(db, request.user_id)
    personalization = (
        request.personalization_enabled
        if request.personalization_enabled is not None
        else prefs.personalization_enabled
    )

    ranked = ranker.rank(
        query=request.query,
        products=products,
        user=user_dict(prefs),
        ranking_mode=request.ranking_mode,
        personalization_enabled=bool(personalization),
        include_pipeline=False,
    )

    total = len(ranked["results"])
    start = (request.page - 1) * request.page_size
    end = start + request.page_size
    page_items = ranked["results"][start:end]

    results = []
    for item in page_items:
        results.append(
            {
                "product": item["product"],
                "rank": item["rank"],
                "score": item["score"],
                "explanation": item["explanation"] if request.include_explanations else None,
            }
        )

    categories = sorted({p["category"] for p in products})
    brands = sorted({p["brand"] for p in products})
    suggestions = autocomplete(request.query)["suggestions"]

    return {
        "query": request.query,
        "ranking_mode": ranked["ranking_mode"],
        "personalization_enabled": ranked["personalization_enabled"],
        "scoring_method": ranked["scoring_method"],
        "model_status": ranked["model_status"],
        "total": total,
        "page": request.page,
        "page_size": request.page_size,
        "results": results,
        "suggestions": suggestions,
        "facets": {"categories": categories, "brands": brands},
    }


def related_terms(product: dict[str, Any]) -> list[str]:
    base = [
        product.get("category", ""),
        product.get("brand", ""),
        *product.get("tags", [])[:3],
    ]
    return [b for b in base if b]
