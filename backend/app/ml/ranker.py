"""Final ranking layer combining semantic, structured, and personalization signals."""

from __future__ import annotations

from typing import Any

import numpy as np

from app.core.config import get_settings
from app.ml.feature_processor import features_to_array, product_document, structured_vector
from app.ml.metrics import pd_at_k
from app.ml.model_loader import model_registry


def _why(product: dict[str, Any], feats: dict[str, float], semantic: float, personalized: bool) -> str:
    reasons = []
    if semantic >= 0.55:
        reasons.append("strong semantic match to your query")
    elif semantic >= 0.35:
        reasons.append("moderate semantic relevance")
    else:
        reasons.append("partial keyword/semantic overlap")

    if personalized:
        if feats.get("category_pref", 0) > 0:
            reasons.append("matches preferred category")
        if feats.get("brand_pref", 0) > 0:
            reasons.append("preferred brand")
        if feats.get("attr_pref", 0) > 0.2:
            reasons.append("aligns with browsing interests")
        if feats.get("history_boost", 0) > 0:
            reasons.append("similar to recent interactions")

    if product.get("rating", 0) >= 4.5:
        reasons.append("high customer rating")

    return "; ".join(reasons).capitalize() + "."


class Ranker:
    def rank(
        self,
        query: str,
        products: list[dict[str, Any]],
        user: dict[str, Any] | None,
        ranking_mode: str = "personalized",
        personalization_enabled: bool = True,
        include_pipeline: bool = False,
    ) -> dict[str, Any]:
        settings = get_settings()
        encoder = model_registry.encoder
        assert encoder is not None

        use_personalization = personalization_enabled and ranking_mode == "personalized"
        if ranking_mode == "relevance":
            use_personalization = False

        query_emb = encoder.encode(query)[0]
        docs = [product_document(p) for p in products]
        # Prefer cache per product
        product_embs = []
        for p, doc in zip(products, docs):
            product_embs.append(encoder.encode_product(p["id"], doc))

        scored: list[dict[str, Any]] = []
        pipeline_samples: list[dict[str, Any]] = []

        for product, pemb in zip(products, product_embs):
            semantic = encoder.cosine_similarity(query_emb, pemb)
            x_matching = encoder.elementwise_match(query_emb, pemb)
            matching_strength = float(np.mean(np.abs(x_matching)))

            feats = structured_vector(product, user, semantic, use_personalization)

            click_p = atc_p = trx_p = None
            scoring_method = "demo_weighted_semantic_structured_personalization"
            model_status = model_registry.mmoe_status

            if model_registry.mmoe_loaded_from_checkpoint and model_registry.mmoe is not None:
                arr = features_to_array(feats).reshape(1, -1)
                probs = model_registry.mmoe.predict_proba(arr.tolist())[0]
                click_p, atc_p, trx_p = probs["click"], probs["atc"], probs["trx"]
                final = 0.35 * click_p + 0.35 * atc_p + 0.30 * trx_p
                scoring_method = "trained_mmoe_multitask"
            else:
                # Honest demonstration ranker (not claimed as trained MMoE)
                structured = feats["structured_score"]
                user_score = feats["user_score"] if use_personalization else 0.0
                final = (
                    settings.rank_w_semantic * semantic
                    + settings.rank_w_structured * structured
                    + (settings.rank_w_personalization * user_score if use_personalization else 0.0)
                )
                # Soft task probabilities shaped from available signals for lab UI
                click_p = float(np.clip(0.55 * semantic + 0.25 * structured + 0.20 * user_score, 0, 1))
                atc_p = float(np.clip(0.40 * semantic + 0.30 * structured + 0.30 * user_score, 0, 1))
                trx_p = float(np.clip(0.30 * semantic + 0.30 * structured + 0.40 * user_score, 0, 1))

            # Deterministic sort modes override score after relevance filter set
            sort_key = final
            if ranking_mode == "price_asc":
                sort_key = -float(product["price"])
            elif ranking_mode == "price_desc":
                sort_key = float(product["price"])
            elif ranking_mode == "rating":
                sort_key = float(product["rating"])
            elif ranking_mode == "popularity":
                sort_key = float(product["popularity"])

            explanation = {
                "semantic_similarity": round(float(semantic), 4),
                "structured_contribution": round(float(feats["structured_score"]), 4),
                "user_preference_contribution": round(float(feats["user_score"]), 4),
                "click_probability": round(float(click_p), 4),
                "atc_probability": round(float(atc_p), 4),
                "purchase_probability": round(float(trx_p), 4),
                "final_score": round(float(final), 4),
                "scoring_method": scoring_method,
                "model_status": model_status,
                "why_this_result": _why(product, feats, semantic, use_personalization),
                "details": {
                    "matching_strength": round(matching_strength, 4),
                    "features": {k: round(float(v), 4) for k, v in feats.items()},
                },
            }

            scored.append(
                {
                    "product": product,
                    "score": float(final),
                    "sort_key": float(sort_key),
                    "explanation": explanation,
                }
            )

            if include_pipeline and len(pipeline_samples) < 5:
                pipeline_samples.append(
                    {
                        "product_id": product["id"],
                        "product_name": product["name"],
                        "query_embedding_dim": int(query_emb.shape[0]),
                        "matching_strength": round(matching_strength, 4),
                        "semantic_similarity": round(float(semantic), 4),
                        "structured_features": explanation["details"]["features"],
                        "task_probabilities": {
                            "click": explanation["click_probability"],
                            "atc": explanation["atc_probability"],
                            "trx": explanation["purchase_probability"],
                        },
                        "final_score": explanation["final_score"],
                    }
                )

        # Primary ranking by score/sort_key; for price_asc we negated so higher sort_key is better
        scored.sort(key=lambda x: x["sort_key"], reverse=True)

        # Also compute relevance-only ordering for PD@K when personalized
        relevance_order = None
        pd_value = None
        comparison = None
        if ranking_mode == "personalized" and include_pipeline:
            rel = self.rank(
                query=query,
                products=products,
                user=user,
                ranking_mode="relevance",
                personalization_enabled=False,
                include_pipeline=False,
            )
            relevance_order = [r["product"]["id"] for r in rel["results"]]
            personalized_order = [r["product"]["id"] for r in scored]
            pd_value = pd_at_k(personalized_order, relevance_order, k=min(10, len(scored)))
            # Position changes
            rel_pos = {pid: i for i, pid in enumerate(relevance_order)}
            changes = []
            for i, pid in enumerate(personalized_order[:10]):
                before = rel_pos.get(pid, -1)
                if before != i:
                    changes.append(
                        {
                            "product_id": pid,
                            "relevance_rank": before + 1 if before >= 0 else None,
                            "personalized_rank": i + 1,
                            "delta": (before - i) if before >= 0 else None,
                        }
                    )
            comparison = {
                "relevance_ids": relevance_order[:10],
                "personalized_ids": personalized_order[:10],
                "position_changes": changes,
                "pd_at_10": pd_value,
                "interpretation": (
                    f"Top-10 overlap PD@10 = {pd_value:.2f}. "
                    "Lower overlap means stronger personalization effect."
                ),
            }

        results = []
        for idx, item in enumerate(scored, start=1):
            results.append(
                {
                    "product": item["product"],
                    "rank": idx,
                    "score": round(item["score"], 4),
                    "explanation": item["explanation"],
                }
            )

        pipeline = None
        if include_pipeline:
            pipeline = {
                "stages": [
                    {
                        "id": 1,
                        "name": "Search query & product information",
                        "description": "Query text and product documents (title, brand, attributes).",
                        "output": {"query": query, "candidate_count": len(products)},
                    },
                    {
                        "id": 2,
                        "name": "TinyBERT-style text encoding",
                        "description": f"Encode query and products with {encoder.status()['model_name']}.",
                        "output": encoder.status(),
                    },
                    {
                        "id": 3,
                        "name": "Query–product element-wise matching",
                        "description": "x_matching = query_emb ⊙ product_emb (richer than dot product).",
                        "output": {"samples": [{"product_id": s["product_id"], "matching_strength": s["matching_strength"]} for s in pipeline_samples]},
                    },
                    {
                        "id": 4,
                        "name": "GTE-style semantic similarity",
                        "description": "Cosine similarity between query and product embeddings.",
                        "output": {"samples": [{"product_id": s["product_id"], "semantic_similarity": s["semantic_similarity"]} for s in pipeline_samples]},
                    },
                    {
                        "id": 5,
                        "name": "Structured features",
                        "description": "Price, rating, popularity, category/brand prefs, interaction history.",
                        "output": {"samples": pipeline_samples},
                    },
                    {
                        "id": 6,
                        "name": "Shared bottom (FT-Transformer / DCN-V2)",
                        "description": "Feature interaction layer producing X_final.",
                        "output": {"configured": "ft-transformer-lite", "status": model_registry.mmoe_status},
                    },
                    {
                        "id": 7,
                        "name": "MMoE shared experts",
                        "description": "Shared experts (more experts than tasks).",
                        "output": {"n_experts": 4, "status": model_registry.mmoe_status},
                    },
                    {
                        "id": 8,
                        "name": "Task-specific gates",
                        "description": "Softmax gates for Click, ATC, and TRX.",
                        "output": {"tasks": ["click", "atc", "trx"]},
                    },
                    {
                        "id": 9,
                        "name": "Prediction towers",
                        "description": "MLP towers produce task probabilities.",
                        "output": {"samples": [{"product_id": s["product_id"], **s["task_probabilities"]} for s in pipeline_samples]},
                    },
                    {
                        "id": 10,
                        "name": "Final personalized ranking",
                        "description": "Products ordered by combined ranking score.",
                        "output": {"top_ids": [r["product"]["id"] for r in results[:10]]},
                    },
                ],
                "disclaimer": (
                    "Pipeline stages mirror the paper architecture. "
                    "Unless a trained MMoE checkpoint is loaded, final scores use the documented demo ranker."
                ),
            }

        return {
            "query": query,
            "ranking_mode": ranking_mode,
            "personalization_enabled": use_personalization,
            "scoring_method": (
                "trained_mmoe_multitask"
                if model_registry.mmoe_loaded_from_checkpoint
                else "demo_weighted_semantic_structured_personalization"
            ),
            "model_status": model_registry.mmoe_status,
            "results": results,
            "pd_at_k": pd_value,
            "comparison": comparison,
            "pipeline": pipeline,
        }


ranker = Ranker()
