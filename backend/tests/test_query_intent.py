import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.query_intent import apply_intent_filters, lexical_relevance, parse_query_intent


def test_parse_under_5k():
    intent = parse_query_intent("buds under 5k")
    assert intent["max_price"] == 5000
    assert "earbuds" in intent["terms"] or "earbud" in intent["terms"]


def test_price_filter():
    products = [
        {"id": "a", "price": 2999, "name": "Earbuds"},
        {"id": "b", "price": 8999, "name": "Premium ANC"},
    ]
    intent = {"max_price": 5000, "min_price": None}
    out = apply_intent_filters(products, intent)
    assert len(out) == 1
    assert out[0]["id"] == "a"


def test_lexical_buds():
    intent = parse_query_intent("buds under 5k")
    earbuds = {"name": "BeatFlex Sport Earbuds", "tags": ["earbuds"], "description": "wireless buds", "brand": "X", "category": "Electronics", "subcategory": "Headphones", "attributes": {}}
    laptop = {"name": "CodeLite Laptop", "tags": ["laptop"], "description": "coding", "brand": "Y", "category": "Electronics", "subcategory": "Laptops", "attributes": {}}
    assert lexical_relevance(earbuds, intent) > lexical_relevance(laptop, intent)
