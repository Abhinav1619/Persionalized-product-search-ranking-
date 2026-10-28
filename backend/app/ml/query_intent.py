"""Parse natural-language shopping constraints from queries.

Examples:
  "buds under 5k" -> max_price=5000, synonyms include earbuds/headphones
  "laptop above 40000" -> min_price=40000
"""

from __future__ import annotations

import re
from typing import Any

SYNONYMS: dict[str, list[str]] = {
    "buds": ["earbud", "earbuds", "earphone", "earphones", "headphone", "headphones", "airpod", "tws"],
    "bud": ["earbud", "earbuds", "earphone", "earphones", "headphone", "headphones"],
    "earphones": ["earbud", "earbuds", "earphone", "headphones", "buds"],
    "headphones": ["headphone", "headset", "earbud", "earbuds", "buds", "anc"],
    "laptop": ["notebook", "ultrabook", "macbook", "coding", "programming"],
    "shoes": ["shoe", "sneakers", "trainers", "footwear", "running", "loafers", "oxfords"],
    "skincare": ["skin", "serum", "moisturizer", "face wash", "sunscreen", "toner"],
    "gym": ["fitness", "workout", "training", "sport"],
    "office": ["formal", "work", "professional"],
}


def _parse_amount(raw: str) -> float:
    cleaned = raw.lower().replace(",", "").replace("₹", "").replace("rs", "").replace("inr", "").strip()
    mult = 1.0
    if cleaned.endswith("k"):
        mult = 1000.0
        cleaned = cleaned[:-1]
    elif cleaned.endswith("l"):
        mult = 100000.0
        cleaned = cleaned[:-1]
    return float(cleaned) * mult


def parse_query_intent(query: str) -> dict[str, Any]:
    q = query.strip()
    q_lower = q.lower()

    max_price: float | None = None
    min_price: float | None = None

    under = re.search(
        r"(?:under|below|less than|upto|up to|max|within)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?\s*[kK]?)",
        q_lower,
    )
    if under:
        max_price = _parse_amount(under.group(1))

    # Patterns like "under 5000" already covered; also "5k budget" / "<5000"
    lt = re.search(r"(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?\s*[kK]?)\s*(?:budget|or less)", q_lower)
    if lt and max_price is None:
        max_price = _parse_amount(lt.group(1))

    over = re.search(
        r"(?:above|over|more than|min(?:imum)?|from)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?\s*[kK]?)",
        q_lower,
    )
    if over:
        min_price = _parse_amount(over.group(1))

    expanded_terms: list[str] = []
    tokens = re.findall(r"[a-z0-9]+", q_lower)
    for tok in tokens:
        if tok in SYNONYMS:
            expanded_terms.extend(SYNONYMS[tok])
        expanded_terms.append(tok)

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique_terms: list[str] = []
    for t in expanded_terms:
        if t not in seen and len(t) > 1:
            seen.add(t)
            unique_terms.append(t)

    return {
        "raw_query": q,
        "min_price": min_price,
        "max_price": max_price,
        "terms": unique_terms,
        "must_match_terms": [t for t in unique_terms if t in SYNONYMS or t in {"earbuds", "headphones", "laptop", "shoes", "skincare"}],
    }


def apply_intent_filters(products: list[dict[str, Any]], intent: dict[str, Any]) -> list[dict[str, Any]]:
    out = products
    if intent.get("min_price") is not None:
        out = [p for p in out if float(p.get("price") or 0) >= float(intent["min_price"])]
    if intent.get("max_price") is not None:
        out = [p for p in out if float(p.get("price") or 0) <= float(intent["max_price"])]
    return out


def lexical_relevance(product: dict[str, Any], intent: dict[str, Any]) -> float:
    """Hard relevance boost so 'buds' surfaces earbuds, not random items."""
    terms: list[str] = intent.get("terms") or []
    if not terms:
        return 0.0
    blob = " ".join(
        [
            str(product.get("name", "")),
            str(product.get("brand", "")),
            str(product.get("category", "")),
            str(product.get("subcategory", "")),
            str(product.get("description", "")),
            " ".join(product.get("tags") or []),
            " ".join(str(v) for v in (product.get("attributes") or {}).values()),
        ]
    ).lower()

    hits = sum(1 for t in terms if t in blob)
    score = hits / max(len(terms), 1)

    # Strong product-type terms
    type_terms = {"earbud", "earbuds", "headphone", "headphones", "laptop", "shoe", "shoes", "serum", "skincare"}
    if any(t in blob for t in type_terms.intersection(terms)):
        score = min(1.0, score + 0.35)
    return float(score)


def relevance_gate(product: dict[str, Any], intent: dict[str, Any], semantic: float, lexical: float) -> bool:
    """Drop clearly irrelevant candidates when the query has concrete product intent."""
    terms = intent.get("terms") or []
    if not terms:
        return True
    # If query mentions a known product family, require lexical signal or strong semantic
    productish = any(
        t in terms
        for t in [
            "buds",
            "bud",
            "earbuds",
            "earphones",
            "headphones",
            "laptop",
            "shoes",
            "skincare",
            "serum",
            "sneakers",
        ]
    )
    if not productish:
        return semantic >= 0.12 or lexical >= 0.08
    return lexical >= 0.12 or semantic >= 0.28
