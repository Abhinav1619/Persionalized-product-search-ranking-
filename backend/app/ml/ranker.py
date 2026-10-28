"""Final ranking layer combining semantic, structured, and personalization signals."""

from __future__ import annotations

from typing import Any

import numpy as np

from app.core.config import get_settings
from app.ml.feature_processor import features_to_array, product_document, structured_vector
from app.ml.metrics import pd_at_k
from app.ml.model_loader import model_registry
from app.ml.query_intent import (
    apply_intent_filters,
    lexical_relevance,
    parse_query_intent,
    relevance_gate,
)


def _why(
    product: dict[str, Any],
    feats: dict[str, float],
    semantic: float,
    personalized: bool,
    intent: dict[str, Any],
    lexical: float,
) -> str:
    reasons = []
    if intent.get("max_price") is not None:
        reasons.append(f"within budget (≤ ₹{int(intent['max_price'])})")
    if intent.get("min_price") is not None:
        reasons.append(f"meets min price (≥ ₹{int(intent['min_price'])})")
    if lexical >= 0.35:
        reasons.append("strong keyword / synonym match to your query")
    elif semantic >= 0.55:
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
        apply_query_constraints: bool = True,
    ) -> dict[str, Any]:
        settings = get_settings()
        encoder = model_registry.encoder
        assert encoder is not None

        intent = parse_query_intent(query)
        candidates = products
        if apply_query_constraints:
            candidates = apply_intent_filters(products, intent)

        use_personalization = personalization_enabled and ranking_mode == "personalized"
        if ranking_mode == "relevance":
            use_personalization = False

        if not candidates:
            return {
                "query": query,
                "ranking_mode": ranking_mode,
                "personalization_enabled": use_personalization,
                "scoring_method": "demo_weighted_semantic_structured_personalization",
                "model_status": model_registry.mmoe_status,
                "results": [],
                "pd_at_k": None,
                "comparison": None,
                "pipeline": None,
                "intent": intent,
                "filtered_count": 0,
                "candidate_count_before_intent": len(products),
            }

        query_emb = encoder.encode(query)[0]
        docs = [product_document(p) for p in candidates]
        product_embs = [encoder.encode_product(p["id"], doc) for p, doc in zip(candidates, docs)]

        scored: list[dict[str, Any]] = []
        pipeline_samples: list[dict[str, Any]] = []

        for product, pemb in zip(candidates, product_embs):
            semantic = encoder.cosine_similarity(query_emb, pemb)
            lexical = lexical_relevance(product, intent)
            if not relevance_gate(product, intent, semantic, lexical):
                continue

            x_matching = encoder.elementwise_match(query_emb, pemb)
            matching_strength = float(np.mean(np.abs(x_matching)))
            feats = structured_vector(product, user, semantic, use_personalization)

            scoring_method = "demo_weighted_semantic_structured_personalization"
            model_status = model_registry.mmoe_status

            if model_registry.mmoe_loaded_from_checkpoint and model_registry.mmoe is not None:
                arr = features_to_array(feats).reshape(1, -1)
                probs = model_registry.mmoe.predict_proba(arr.tolist())[0]
                click_p, atc_p, trx_p = probs["click"], probs["atc"], probs["trx"]
                final = 0.35 * click_p + 0.35 * atc_p + 0.30 * trx_p
                scoring_method = "trained_mmoe_multitask"
            else:
                structured = feats["structured_score"]
                user_score = feats["user_score"] if use_personalization else 0.0
                # Lexical boost keeps "buds" results on earbuds, not random cheap items
                final = (
                    0.38 * semantic
                    + 0.32 * lexical
                    + 0.15 * structured
                    + (0.15 * user_score if use_personalization else 0.0)
                )
                click_p = float(np.clip(0.45 * semantic + 0.30 * lexical + 0.15 * structured + 0.10 * user_score, 0, 1))
                atc_p = float(np.clip(0.35 * semantic + 0.30 * lexical + 0.20 * structured + 0.15 * user_score, 0, 1))
                trx_p = float(np.clip(0.25 * semantic + 0.25 * lexical + 0.25 * structured + 0.25 * user_score, 0, 1))

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
                "why_this_result": _why(product, feats, semantic, use_personalization, intent, lexical),
                "details": {
                    "matching_strength": round(matching_strength, 4),
                    "lexical_relevance": round(float(lexical), 4),
                    "intent": {
                        "min_price": intent.get("min_price"),
                        "max_price": intent.get("max_price"),
                    },
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
                        "price": product["price"],
                        "query_embedding_dim": int(query_emb.shape[0]),
                        "matching_strength": round(matching_strength, 4),
                        "semantic_similarity": round(float(semantic), 4),
                        "lexical_relevance": round(float(lexical), 4),
                        "structured_features": explanation["details"]["features"],
                        "task_probabilities": {
                            "click": explanation["click_probability"],
                            "atc": explanation["atc_probability"],
                            "trx": explanation["purchase_probability"],
                        },
                        "final_score": explanation["final_score"],
                    }
                )

        scored.sort(key=lambda x: x["sort_key"], reverse=True)

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
                apply_query_constraints=apply_query_constraints,
            )
            relevance_order = [r["product"]["id"] for r in rel["results"]]
            personalized_order = [r["product"]["id"] for r in scored]
            pd_value = pd_at_k(personalized_order, relevance_order, k=min(10, len(scored)))
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
                        "name": "Search query & constraints",
                        "description": "Parse query intent (price caps, synonyms) and load product documents.",
                        "output": {
                            "query": query,
                            "intent": intent,
                            "candidates_after_price_filter": len(candidates),
                            "catalog_size": len(products),
                        },
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
                        "output": {
                            "samples": [
                                {"product_id": s["product_id"], "matching_strength": s["matching_strength"]}
                                for s in pipeline_samples
                            ]
                        },
                    },
                    {
                        "id": 4,
                        "name": "GTE-style semantic similarity",
                        "description": "Cosine similarity between query and product embeddings.",
                        "output": {
                            "samples": [
                                {
                                    "product_id": s["product_id"],
                                    "semantic_similarity": s["semantic_similarity"],
                                    "lexical_relevance": s["lexical_relevance"],
                                }
                                for s in pipeline_samples
                            ]
                        },
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
                        "output": {
                            "samples": [
                                {"product_id": s["product_id"], **s["task_probabilities"]} for s in pipeline_samples
                            ]
                        },
                    },
                    {
                        "id": 10,
                        "name": "Final personalized ranking",
                        "description": "Budget-compliant, relevance-gated products ordered by ranking score.",
                        "output": {
                            "top_ids": [r["product"]["id"] for r in results[:10]],
                            "top_prices": [r["product"]["price"] for r in results[:10]],
                        },
                    },
                ],
                "disclaimer": (
                    "Pipeline stages mirror the paper architecture. "
                    "Query intent filters (e.g. under ₹5k) are applied before ranking."
                ),
            }

        return {
            "query": query,
            "ranking_mode": ranking_mode,
            "personalization_enabled": use_personalization,
            "scoring_method": (
                "trained_mmoe_multitask"
                if model_registry.mmoe_loaded_from_checkpoint
                else "demo_weighted_semantic_lexical_personalization"
            ),
            "model_status": model_registry.mmoe_status,
            "results": results,
            "pd_at_k": pd_value,
            "comparison": comparison,
            "pipeline": pipeline,
            "intent": intent,
            "filtered_count": len(results),
            "candidate_count_before_intent": len(products),
        }


ranker = Ranker()
