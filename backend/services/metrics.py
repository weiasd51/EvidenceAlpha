from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import Prediction


def calculate_metrics(db: Session) -> dict:
    predictions = list(db.scalars(select(Prediction)).all())
    settled = [item for item in predictions if item.settled]
    total = len(predictions)
    settled_count = len(settled)
    accuracy = sum(bool(item.correct) for item in settled) / settled_count if settled_count else 0.0
    brier_values = [item.brier_score for item in settled if item.brier_score is not None]
    excess_values = [item.excess_return for item in settled if item.excess_return is not None]
    avg_brier = sum(brier_values) / len(brier_values) if brier_values else 0.0
    avg_excess = sum(excess_values) / len(excess_values) if excess_values else 0.0
    avg_confidence = sum(item.confidence for item in settled) / settled_count if settled_count else 0.0

    by_mode: dict[str, list[Prediction]] = defaultdict(list)
    for item in settled:
        by_mode[item.analysis.mode].append(item)
    modes = []
    for mode, values in sorted(by_mode.items()):
        modes.append(
            {
                "mode": mode,
                "count": len(values),
                "accuracy": round(sum(bool(v.correct) for v in values) / len(values), 4),
                "brier_score": round(
                    sum((v.brier_score or 0.0) for v in values) / len(values), 4
                ),
            }
        )

    return {
        "total_predictions": total,
        "settled_predictions": settled_count,
        "accuracy": round(accuracy, 4),
        "average_brier_score": round(avg_brier, 4),
        "average_excess_return": round(avg_excess, 4),
        "calibration_gap": round(abs(avg_confidence - accuracy), 4) if settled_count else 0.0,
        "modes": modes,
    }

