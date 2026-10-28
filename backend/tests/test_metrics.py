import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.metrics import auc_roc, mrr_at_k, pd_at_k


def test_pd_at_k_overlap():
    a = ["1", "2", "3", "4", "5"]
    b = ["1", "2", "3", "9", "8"]
    assert pd_at_k(a, b, k=5) == 0.6


def test_mrr():
    ranked = [[False, True, False], [True, False, False]]
    assert abs(mrr_at_k(ranked, k=3) - ((1 / 2) + 1) / 2) < 1e-6


def test_auc():
    score = auc_roc([0, 0, 1, 1], [0.1, 0.4, 0.35, 0.8])
    assert score is not None
    assert 0.5 < score <= 1.0
