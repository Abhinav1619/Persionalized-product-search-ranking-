"""Semantic text encoders for query–product matching.

Default: sentence-transformers/all-MiniLM-L6-v2 (CPU-friendly pretrained model).
This is NOT the paper's fine-tuned TinyBERT/GTE — those checkpoints are proprietary.
"""

from __future__ import annotations

import logging
import re
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


class HashingEncoder:
    """Deterministic bag-of-words hashing fallback when HF models are unavailable."""

    def __init__(self, dim: int = 384) -> None:
        self.dim = dim
        self.model_name = "hashing-fallback"
        self.model_type = "fallback"
        self.ready = True

    def encode(self, texts: list[str] | str, batch_size: int = 32) -> np.ndarray:
        if isinstance(texts, str):
            texts = [texts]
        vectors = []
        for text in texts:
            vec = np.zeros(self.dim, dtype=np.float32)
            tokens = _tokenize(text)
            if not tokens:
                vectors.append(vec)
                continue
            for tok in tokens:
                idx = hash(tok) % self.dim
                vec[idx] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec /= norm
            vectors.append(vec)
        return np.vstack(vectors)


class SemanticEncoder:
    """Loads a SentenceTransformer once and caches product embeddings."""

    def __init__(self, model_name: str, device: str = "cpu", enabled: bool = True) -> None:
        self.model_name = model_name
        self.device = device
        self.enabled = enabled
        self.model: Any = None
        self.model_type = "unavailable"
        self.ready = False
        self._product_cache: dict[str, np.ndarray] = {}
        self._fallback = HashingEncoder()

    def load(self) -> None:
        if not self.enabled:
            logger.warning("Semantic model disabled; using hashing fallback encoder.")
            self.model_type = "fallback"
            self.ready = True
            return
        try:
            from sentence_transformers import SentenceTransformer

            logger.info("Loading semantic model %s on %s ...", self.model_name, self.device)
            self.model = SentenceTransformer(self.model_name, device=self.device)
            self.model_type = "sentence-transformers"
            self.ready = True
            logger.info("Semantic model ready.")
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to load semantic model (%s). Using hashing fallback.", exc)
            self.model = None
            self.model_type = "fallback"
            self.ready = True

    def encode(self, texts: list[str] | str, batch_size: int = 32) -> np.ndarray:
        if isinstance(texts, str):
            texts = [texts]
        if self.model is None:
            return self._fallback.encode(texts, batch_size=batch_size)
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return np.asarray(embeddings, dtype=np.float32)

    def encode_product(self, product_id: str, text: str) -> np.ndarray:
        if product_id in self._product_cache:
            return self._product_cache[product_id]
        emb = self.encode(text)[0]
        self._product_cache[product_id] = emb
        return emb

    def clear_cache(self) -> None:
        self._product_cache.clear()

    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        if a.ndim > 1:
            a = a.reshape(-1)
        if b.ndim > 1:
            b = b.reshape(-1)
        denom = float(np.linalg.norm(a) * np.linalg.norm(b))
        if denom == 0:
            return 0.0
        return float(np.dot(a, b) / denom)

    @staticmethod
    def elementwise_match(query_emb: np.ndarray, product_emb: np.ndarray) -> np.ndarray:
        """TinyBERT-style element-wise query–product interaction (x_matching)."""
        return np.asarray(query_emb) * np.asarray(product_emb)

    def status(self) -> dict[str, Any]:
        return {
            "ready": self.ready,
            "model_name": self.model_name if self.model_type != "fallback" else self._fallback.model_name,
            "model_type": self.model_type,
            "device": self.device,
            "cached_products": len(self._product_cache),
            "note": (
                "Pretrained public checkpoint — not fine-tuned on the proprietary paper dataset."
                if self.model_type == "sentence-transformers"
                else "Hashing fallback active; install torch/sentence-transformers for real embeddings."
            ),
        }
