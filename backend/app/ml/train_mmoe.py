"""Reproducible MMoE training entrypoint.

Expects a prepared CSV/Parquet with feature columns + click/atc/trx labels.
This ships as a pipeline stub — the proprietary paper dataset is not included.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np


def main() -> None:
    parser = argparse.ArgumentParser(description="Train RankWise MMoE on a prepared dataset")
    parser.add_argument("--data", type=Path, required=True, help="Path to .npz feature matrix")
    parser.add_argument("--labels", type=Path, required=True, help="Path to .npz with click/atc/trx columns")
    parser.add_argument("--out", type=Path, default=Path("artifacts/mmoe.pt"))
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--shared-bottom", choices=["ft", "dcn"], default="ft")
    args = parser.parse_args()

    try:
        import torch
        from torch.utils.data import DataLoader, TensorDataset

        from app.ml.mmoe import MMoE, multitask_bce_loss
    except Exception as exc:  # noqa: BLE001
        raise SystemExit(f"PyTorch is required for training: {exc}") from exc

    x = np.load(args.data)
    y = np.load(args.labels)
    if y.ndim != 2 or y.shape[1] != 3:
        raise SystemExit("labels array must have shape [N, 3] for click, atc, trx")

    model = MMoE(input_dim=x.shape[1], shared_bottom=args.shared_bottom)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr)
    ds = TensorDataset(
        torch.tensor(x, dtype=torch.float32),
        torch.tensor(y[:, 0], dtype=torch.float32),
        torch.tensor(y[:, 1], dtype=torch.float32),
        torch.tensor(y[:, 2], dtype=torch.float32),
    )
    loader = DataLoader(ds, batch_size=min(2048, len(ds)), shuffle=True)

    model.train()
    for epoch in range(args.epochs):
        total = 0.0
        for xb, yc, ya, yt in loader:
            opt.zero_grad()
            preds = model(xb)
            loss = multitask_bce_loss(
                preds,
                {"click": yc, "atc": ya, "trx": yt},
                weights={"click": 1.0, "atc": 1.0, "trx": 1.0},
            )
            loss.backward()
            opt.step()
            total += float(loss.item())
        print(f"epoch={epoch + 1} loss={total / max(len(loader), 1):.4f}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), args.out)
    print(f"Saved checkpoint to {args.out}")


if __name__ == "__main__":
    main()
