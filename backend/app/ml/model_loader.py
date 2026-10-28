"""Model lifecycle: semantic encoder + optional trained MMoE checkpoint."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.ml.encoders import SemanticEncoder

logger = logging.getLogger(__name__)

try:
    import torch
    from app.ml.mmoe import MMoE

    TORCH_AVAILABLE = True
except Exception:  # noqa: BLE001
    torch = None  # type: ignore
    MMoE = None  # type: ignore
    TORCH_AVAILABLE = False


class ModelRegistry:
    def __init__(self) -> None:
        self.encoder: SemanticEncoder | None = None
        self.mmoe: Any = None
        self.mmoe_loaded_from_checkpoint = False
        self.mmoe_status = "uninitialized"
        self.torch_available = TORCH_AVAILABLE

    def initialize(self) -> None:
        settings = get_settings()
        self.encoder = SemanticEncoder(
            model_name=settings.semantic_model_name,
            device=settings.semantic_device,
            enabled=settings.enable_semantic_model,
        )
        self.encoder.load()

        if not TORCH_AVAILABLE or MMoE is None:
            self.mmoe = None
            self.mmoe_loaded_from_checkpoint = False
            self.mmoe_status = "torch_unavailable_demo_ranker"
            logger.warning("PyTorch unavailable — MMoE architecture disabled; demo ranker active.")
            return

        self.mmoe = MMoE(input_dim=10, shared_bottom="ft", n_experts=4)
        ckpt = settings.mmoe_checkpoint_path.strip()
        if ckpt and Path(ckpt).exists():
            try:
                state = torch.load(ckpt, map_location="cpu")  # type: ignore[union-attr]
                self.mmoe.load_state_dict(state)
                self.mmoe.eval()
                self.mmoe_loaded_from_checkpoint = True
                self.mmoe_status = "trained_checkpoint"
                logger.info("Loaded MMoE checkpoint from %s", ckpt)
            except Exception as exc:  # noqa: BLE001
                logger.exception("Failed to load MMoE checkpoint: %s", exc)
                self.mmoe.eval()
                self.mmoe_loaded_from_checkpoint = False
                self.mmoe_status = "demo_untrained_weights"
        else:
            self.mmoe.eval()
            self.mmoe_loaded_from_checkpoint = False
            self.mmoe_status = "demo_untrained_weights"
            logger.info("No MMoE checkpoint configured — using demonstration ranking fallback.")

    def status(self) -> dict[str, Any]:
        settings = get_settings()
        enc = self.encoder.status() if self.encoder else {"ready": False}
        return {
            "semantic": enc,
            "torch_available": self.torch_available,
            "mmoe": {
                "status": self.mmoe_status,
                "checkpoint_path": settings.mmoe_checkpoint_path or None,
                "loaded_from_checkpoint": self.mmoe_loaded_from_checkpoint,
                "architecture": {
                    "shared_bottom": getattr(self.mmoe, "shared_bottom_type", "ft") if self.mmoe else None,
                    "n_experts": getattr(self.mmoe, "n_experts", None) if self.mmoe else None,
                    "tasks": ["click", "atc", "trx"],
                },
                "note": (
                    "Trained MMoE weights loaded."
                    if self.mmoe_loaded_from_checkpoint
                    else "Demonstration mode: ranking uses semantic + structured + preference fallback. "
                    "MMoE architecture is available for the AI lab and future checkpoint loading when PyTorch is installed."
                ),
            },
            "device": settings.semantic_device,
            "gpu_required": False,
        }


model_registry = ModelRegistry()
