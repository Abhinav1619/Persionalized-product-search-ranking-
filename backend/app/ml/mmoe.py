"""Multi-gate Mixture-of-Experts (MMoE) architecture for Click / ATC / TRX.

This is a faithful modular PyTorch implementation of the architecture described
in the presentation. Without trained weights it is used only for architecture
demonstration and soft probability shaping — not claimed as paper reproduction.
"""

from __future__ import annotations

from typing import Any

import torch
import torch.nn as nn
import torch.nn.functional as F


class Expert(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 64) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class Tower(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 32) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).squeeze(-1)


class SharedBottomFTTransformerLite(nn.Module):
    """Lightweight shared bottom inspired by FT-Transformer (feature mixing MLP)."""

    def __init__(self, input_dim: int, output_dim: int = 64) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, output_dim),
            nn.LayerNorm(output_dim),
            nn.ReLU(),
            nn.Linear(output_dim, output_dim),
            nn.LayerNorm(output_dim),
            nn.ReLU(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class SharedBottomDCNv2Lite(nn.Module):
    """Simplified DCN-V2-style cross + deep shared bottom."""

    def __init__(self, input_dim: int, output_dim: int = 64, n_cross: int = 2) -> None:
        super().__init__()
        self.n_cross = n_cross
        self.cross_weights = nn.ParameterList(
            [nn.Parameter(torch.randn(input_dim, 1) * 0.01) for _ in range(n_cross)]
        )
        self.cross_bias = nn.ParameterList(
            [nn.Parameter(torch.zeros(input_dim)) for _ in range(n_cross)]
        )
        self.deep = nn.Sequential(
            nn.Linear(input_dim, output_dim),
            nn.ReLU(),
            nn.Linear(output_dim, output_dim),
            nn.ReLU(),
        )
        self.out = nn.Linear(input_dim + output_dim, output_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x0 = x
        xl = x
        for w, b in zip(self.cross_weights, self.cross_bias):
            xl = x0 * (xl @ w).squeeze(-1).unsqueeze(-1) + b + xl
        deep = self.deep(x)
        return self.out(torch.cat([xl, deep], dim=-1))


class MMoE(nn.Module):
    TASKS = ("click", "atc", "trx")

    def __init__(
        self,
        input_dim: int = 10,
        shared_dim: int = 64,
        n_experts: int = 4,
        expert_dim: int = 64,
        tower_dim: int = 32,
        shared_bottom: str = "ft",
    ) -> None:
        super().__init__()
        if shared_bottom == "dcn":
            self.shared_bottom: nn.Module = SharedBottomDCNv2Lite(input_dim, shared_dim)
        else:
            self.shared_bottom = SharedBottomFTTransformerLite(input_dim, shared_dim)

        self.experts = nn.ModuleList([Expert(shared_dim, expert_dim) for _ in range(n_experts)])
        self.gates = nn.ModuleDict(
            {task: nn.Linear(shared_dim, n_experts) for task in self.TASKS}
        )
        self.towers = nn.ModuleDict(
            {task: Tower(expert_dim, tower_dim) for task in self.TASKS}
        )
        self.shared_bottom_type = shared_bottom
        self.n_experts = n_experts

    def forward(self, x: torch.Tensor) -> dict[str, torch.Tensor]:
        h = self.shared_bottom(x)
        expert_outs = torch.stack([expert(h) for expert in self.experts], dim=1)  # [B, E, D]
        outputs: dict[str, torch.Tensor] = {}
        gate_weights: dict[str, torch.Tensor] = {}
        for task in self.TASKS:
            gate = F.softmax(self.gates[task](h), dim=-1)  # [B, E]
            gate_weights[task] = gate
            combined = torch.sum(expert_outs * gate.unsqueeze(-1), dim=1)
            logits = self.towers[task](combined)
            outputs[task] = torch.sigmoid(logits)
        outputs["_gate_weights"] = gate_weights  # type: ignore[assignment]
        return outputs

    def predict_proba(self, features: list[list[float]] | Any) -> list[dict[str, float]]:
        self.eval()
        with torch.no_grad():
            x = torch.tensor(features, dtype=torch.float32)
            out = self.forward(x)
            results = []
            for i in range(x.shape[0]):
                results.append(
                    {
                        "click": float(out["click"][i]),
                        "atc": float(out["atc"][i]),
                        "trx": float(out["trx"][i]),
                    }
                )
            return results


def multitask_bce_loss(
    preds: dict[str, torch.Tensor],
    labels: dict[str, torch.Tensor],
    weights: dict[str, float] | None = None,
) -> torch.Tensor:
    """Weighted sum of binary cross-entropy losses: L = a1 L_click + a2 L_atc + a3 L_trx."""
    weights = weights or {"click": 1.0, "atc": 1.0, "trx": 1.0}
    loss = torch.tensor(0.0)
    for task in MMoE.TASKS:
        loss = loss + weights[task] * F.binary_cross_entropy(preds[task], labels[task])
    return loss
