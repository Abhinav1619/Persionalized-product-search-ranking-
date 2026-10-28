"""Persist AI Lab runs to a local JSON file for previous-result browsing."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

HISTORY_PATH = Path(__file__).resolve().parent.parent / "seed" / "lab_history.json"
MAX_ENTRIES = 40


def _read() -> list[dict[str, Any]]:
    if not HISTORY_PATH.exists():
        return []
    try:
        data = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:  # noqa: BLE001
        return []


def _write(entries: list[dict[str, Any]]) -> None:
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    HISTORY_PATH.write_text(json.dumps(entries, indent=2, ensure_ascii=False), encoding="utf-8")


def list_history(limit: int = 20) -> list[dict[str, Any]]:
    return _read()[:limit]


def get_history_entry(entry_id: str) -> dict[str, Any] | None:
    for item in _read():
        if item.get("id") == entry_id:
            return item
    return None


def save_lab_run(payload: dict[str, Any]) -> dict[str, Any]:
    """Store a compact snapshot of a lab ranking run."""
    results = payload.get("results") or []
    compact_results = []
    for r in results[:12]:
        product = r.get("product") or {}
        explanation = r.get("explanation") or {}
        compact_results.append(
            {
                "rank": r.get("rank"),
                "score": r.get("score"),
                "product": {
                    "id": product.get("id"),
                    "name": product.get("name"),
                    "brand": product.get("brand"),
                    "price": product.get("price"),
                    "image_url": product.get("image_url"),
                    "category": product.get("category"),
                },
                "why": explanation.get("why_this_result"),
                "semantic_similarity": explanation.get("semantic_similarity"),
                "click_probability": explanation.get("click_probability"),
                "atc_probability": explanation.get("atc_probability"),
                "purchase_probability": explanation.get("purchase_probability"),
            }
        )

    entry = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "query": payload.get("query"),
        "user_id": payload.get("user_id"),
        "ranking_mode": payload.get("ranking_mode"),
        "scoring_method": payload.get("scoring_method"),
        "model_status": payload.get("model_status"),
        "pd_at_k": payload.get("pd_at_k"),
        "intent": payload.get("intent"),
        "result_count": len(results),
        "top_results": compact_results,
        "comparison": payload.get("comparison"),
    }

    entries = _read()
    entries.insert(0, entry)
    _write(entries[:MAX_ENTRIES])
    return entry


def clear_history() -> None:
    _write([])
