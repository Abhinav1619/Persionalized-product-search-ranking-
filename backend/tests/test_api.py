import os
import sys

import pytest
from fastapi.testclient import TestClient

# Ensure backend package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ["ENABLE_SEMANTIC_MODEL"] = "false"
os.environ["DATABASE_URL"] = "sqlite:///./test_rankwise.db"

from app.db.init_db import init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.ml.model_loader import model_registry  # noqa: E402


@pytest.fixture(scope="module")
def client():
    init_db()
    model_registry.initialize()
    with TestClient(app) as c:
        yield c


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_list_products(client):
    r = client.get("/api/products?page_size=10")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 40
    assert len(data["items"]) > 0


def test_get_product(client):
    r = client.get("/api/products/p001")
    assert r.status_code == 200
    assert r.json()["product"]["id"] == "p001"


def test_search_ranks_products(client):
    r = client.post(
        "/api/search",
        json={
            "query": "wireless headphones for gym under 5000",
            "user_id": "demo-fitness",
            "ranking_mode": "personalized",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["total"] > 0
    assert data["results"][0]["explanation"]["scoring_method"]
    names = " ".join(item["product"]["name"].lower() for item in data["results"][:5])
    assert "headphone" in names or "earbud" in names or "headset" in names or "band" in names


def test_personalization_changes_ranking(client):
    payload = {
        "query": "shoes for everyday wear",
        "ranking_mode": "personalized",
        "page_size": 20,
    }
    fitness = client.post("/api/search", json={**payload, "user_id": "demo-fitness"}).json()
    formal = client.post("/api/search", json={**payload, "user_id": "demo-formal"}).json()
    fit_ids = [x["product"]["id"] for x in fitness["results"][:8]]
    form_ids = [x["product"]["id"] for x in formal["results"][:8]]
    assert fit_ids != form_ids


def test_relevance_vs_personalized(client):
    r = client.post(
        "/api/rank",
        json={
            "query": "lightweight laptop for programming",
            "user_id": "demo-developer",
            "ranking_mode": "personalized",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["pipeline"] is not None
    assert data["comparison"] is not None
    assert data["pd_at_k"] is not None


def test_events_and_analytics(client):
    e = client.post(
        "/api/events",
        json={"event_type": "click", "user_id": "demo-guest", "product_id": "p001", "is_demo": True},
    )
    assert e.status_code == 200
    overview = client.get("/api/analytics/overview")
    assert overview.status_code == 200
    assert overview.json()["total_products"] >= 40
    ranking = client.get("/api/analytics/ranking")
    assert ranking.status_code == 200
    assert "published_reference_results" in ranking.json()


def test_user_preferences(client):
    r = client.get("/api/users/demo-fitness/preferences")
    assert r.status_code == 200
    prefs = r.json()
    assert "Electronics" in prefs["preferred_categories"]
    updated = client.put(
        "/api/users/demo-fitness/preferences",
        json={"price_sensitivity": 0.7},
    )
    assert updated.status_code == 200
    assert updated.json()["price_sensitivity"] == 0.7


def test_models_status(client):
    r = client.get("/api/models/status")
    assert r.status_code == 200
    assert "semantic" in r.json()
    assert "mmoe" in r.json()
