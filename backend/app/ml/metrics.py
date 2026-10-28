"""Evaluation metrics: AUC-ROC, MRR@K, PD@K, CTR, ATC rate, purchase conversion."""

from __future__ import annotations

from typing import Any, Sequence

import numpy as np


def auc_roc(y_true: Sequence[int], y_score: Sequence[float]) -> float | None:
    y_true_arr = np.asarray(y_true)
    y_score_arr = np.asarray(y_score)
    if len(y_true_arr) < 2 or len(np.unique(y_true_arr)) < 2:
        return None
    try:
        from sklearn.metrics import roc_auc_score

        return float(roc_auc_score(y_true_arr, y_score_arr))
    except Exception:  # noqa: BLE001
        return None


def mrr_at_k(ranked_relevant: Sequence[Sequence[bool]], k: int = 10) -> float | None:
    """Mean Reciprocal Rank @ K. Each item is a relevance list aligned to ranked positions."""
    if not ranked_relevant:
        return None
    rr_sum = 0.0
    for rels in ranked_relevant:
        rr = 0.0
        for idx, rel in enumerate(rels[:k]):
            if rel:
                rr = 1.0 / (idx + 1)
                break
        rr_sum += rr
    return rr_sum / len(ranked_relevant)


def pd_at_k(personalized_ids: Sequence[str], relevance_ids: Sequence[str], k: int = 10) -> float:
    """Personalization Degree @ K.

    PPT definition: average top-K overlap between rankings with and without
    user-specific features. Lower overlap => larger personalization effect.
    We return overlap in [0, 1].
    """
    a = set(list(personalized_ids)[:k])
    b = set(list(relevance_ids)[:k])
    if k == 0:
        return 1.0
    return len(a & b) / float(k)


def click_through_rate(impressions: int, clicks: int) -> float | None:
    if impressions <= 0:
        return None
    return clicks / impressions


def atc_rate(clicks: int, atc: int) -> float | None:
    if clicks <= 0:
        return None
    return atc / clicks


def purchase_conversion(atc: int, purchases: int) -> float | None:
    if atc <= 0:
        return None
    return purchases / atc


def metric_payload(value: float | None, definition: str) -> dict[str, Any]:
    return {
        "value": value,
        "available": value is not None,
        "definition": definition,
    }
