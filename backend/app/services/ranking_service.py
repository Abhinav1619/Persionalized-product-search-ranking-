from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.ml.ranker import ranker
from app.models.product import Product
from app.schemas.ranking import RankRequest
from app.services.personalization_service import get_user_preferences, user_dict
from app.services.product_serializer import serialize_product


def rank_products(db: Session, request: RankRequest, include_pipeline: bool = True) -> dict[str, Any]:
    q = db.query(Product)
    if request.product_ids:
        q = q.filter(Product.id.in_(request.product_ids))
    rows = q.all()
    products = [serialize_product(r) for r in rows]

    prefs = get_user_preferences(db, request.user_id)
    personalization = (
        request.personalization_enabled
        if request.personalization_enabled is not None
        else prefs.personalization_enabled
    )

    return ranker.rank(
        query=request.query or "recommended products",
        products=products,
        user=user_dict(prefs),
        ranking_mode=request.ranking_mode,
        personalization_enabled=bool(personalization),
        include_pipeline=include_pipeline,
    )
