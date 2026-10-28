"""Initialize schema and seed demo data."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from sqlalchemy.orm import Session

from app.db.session import Base, SessionLocal, engine
from app.models.product import Product
from app.models.user import UserProfile

logger = logging.getLogger(__name__)

SEED_DIR = Path(__file__).resolve().parent.parent / "seed"


def _load_json(name: str) -> list | dict:
    path = SEED_DIR / name
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def seed_database(db: Session) -> None:
    if db.query(Product).count() == 0:
        products = _load_json("demo_products.json")
        for p in products:
            db.add(
                Product(
                    id=p["id"],
                    name=p["name"],
                    brand=p["brand"],
                    category=p["category"],
                    subcategory=p.get("subcategory", ""),
                    description=p.get("description", ""),
                    price=p["price"],
                    original_price=p.get("original_price"),
                    rating=p.get("rating", 4.0),
                    review_count=p.get("review_count", 0),
                    popularity=p.get("popularity", 0.5),
                    image_url=p.get("image_url", ""),
                    attributes_json=json.dumps(p.get("attributes") or {}),
                    specs_json=json.dumps(p.get("specs") or {}),
                    tags_json=json.dumps(p.get("tags") or []),
                )
            )
        logger.info("Seeded %s products", len(products))

    if db.query(UserProfile).count() == 0:
        users = _load_json("demo_users.json")
        for u in users:
            db.add(
                UserProfile(
                    id=u["id"],
                    display_name=u["display_name"],
                    preferred_categories_json=json.dumps(u.get("preferred_categories") or []),
                    preferred_brands_json=json.dumps(u.get("preferred_brands") or []),
                    preferred_attributes_json=json.dumps(u.get("preferred_attributes") or []),
                    browsing_interests_json=json.dumps(u.get("browsing_interests") or []),
                    recent_interactions_json=json.dumps(u.get("recent_interactions") or []),
                    price_sensitivity=u.get("price_sensitivity", 0.5),
                    personalization_enabled=u.get("personalization_enabled", True),
                )
            )
        logger.info("Seeded %s user profiles", len(users))

    db.commit()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
