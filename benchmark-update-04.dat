from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base
from backend.models import AnalysisRun, Prediction
from backend.schemas import AnalyzeRequest
from backend.services.metrics import calculate_metrics
from backend.services.workflow import ResearchWorkflow, settle_prediction


SYMBOLS = ("300750", "600519", "000858", "601318")
AS_OF_DATES = (
    datetime(2024, 1, 15, 8, tzinfo=timezone.utc),
    datetime(2024, 4, 15, 8, tzinfo=timezone.utc),
    datetime(2024, 7, 15, 8, tzinfo=timezone.utc),
    datetime(2024, 10, 15, 8, tzinfo=timezone.utc),
)
HORIZONS = (1, 5, 20)
MODES = ("single", "debate", "debate_memory")
EXCESS_MAGNITUDE = {
    1: (0.006, -0.004),
    5: (0.022, -0.016),
    20: (0.052, -0.038),
}


@dataclass(frozen=True)
class BenchmarkCase:
    case_id: str
    symbol: str
    as_of: datetime
    horizon_days: int
    actual_return: float
    benchmark_return: float


def build_cases() -> list[BenchmarkCase]:
    """Build 48 deterministic synthetic cases with a 2:1 up/down outcome mix."""
    cases: list[BenchmarkCase] = []
    index = 0
    for as_of in AS_OF_DATES:
        for symbol_index, symbol in enumerate(SYMBOLS):
            for horizon_days in HORIZONS:
                positive = index % 3 != 2
                benchmark_return = round((symbol_index - 1.5) * 0.001, 4)
                positive_excess, negative_excess = EXCESS_MAGNITUDE[horizon_days]
                excess_return = positive_excess if positive else negative_excess
                cases.append(
                    BenchmarkCase(
                        case_id=f"{as_of:%Y%m%d}-{symbol}-T{horizon_days}",
                        symbol=symbol,
                        as_of=as_of,
                        horizon_days=horizon_days,
                        actual_return=round(benchmark_return + excess_return, 4),
                        benchmark_return=benchmark_return,
                    )
                )
                index += 1
    return cases


def _utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _new_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    return factory()


def _run_mode(mode: str, cases: list[BenchmarkCase]) -> dict:
    db = _new_session()
    evidence_checks = 0
    point_in_time_violations = 0
    complete_runs = 0
    try:
        for case in cases:
            workflow = ResearchWorkflow(db)
            # Benchmarks must never depend on a developer's local model key.
            workflow.llm.settings.llm_api_key = ""
            analysis = workflow.run(
                AnalyzeRequest(
                    symbol=case.symbol,
                    query=f"Synthetic benchmark case {case.case_id}",
                    horizon_days=case.horizon_days,
                    mode=mode,
                    as_of=case.as_of,
                )
            )
            for link in analysis.links:
                evidence_checks += 1
                if _utc(link.evidence.published_at) > _utc(analysis.as_of):
                    point_in_time_violations += 1

            prediction = settle_prediction(
                db,
                analysis.prediction,
                case.actual_return,
                case.benchmark_return,
            )
            prediction.settled_at = case.as_of + timedelta(days=case.horizon_days)
            db.commit()
            if (
                len(analysis.links) == 4
                and analysis.agent_trace
                and prediction.settled
                and prediction.brier_score is not None
                and analysis.invalidation_conditions
            ):
                complete_runs += 1

        metrics = calculate_metrics(db)
        runs = db.query(AnalysisRun).count()
        settled = db.query(Prediction).filter(Prediction.settled.is_(True)).count()
        return {
            "mode": mode,
            "runs": runs,
            "settled_predictions": settled,
            "accuracy": metrics["accuracy"],
            "brier_score": metrics["average_brier_score"],
            "calibration_gap": metrics["calibration_gap"],
            "average_excess_return": metrics["average_excess_return"],
            "audit_complete_runs": complete_runs,
            "evidence_checks": evidence_checks,
            "point_in_time_violations": point_in_time_violations,
        }
    finally:
        db.close()


def run_benchmark() -> dict:
    cases = build_cases()
    modes = [_run_mode(mode, cases) for mode in MODES]
    total_runs = sum(item["runs"] for item in modes)
    total_settled = sum(item["settled_predictions"] for item in modes)
    total_complete = sum(item["audit_complete_runs"] for item in modes)
    total_checks = sum(item["evidence_checks"] for item in modes)
    total_violations = sum(item["point_in_time_violations"] for item in modes)
    weighted_accuracy = sum(item["accuracy"] * item["runs"] for item in modes) / total_runs
    weighted_brier = sum(item["brier_score"] * item["runs"] for item in modes) / total_runs
    mode_map = {item["mode"]: item for item in modes}
    debate_brier = mode_map["debate"]["brier_score"]
    memory_brier = mode_map["debate_memory"]["brier_score"]
    memory_improvement = (debate_brier - memory_brier) / debate_brier
    return {
        "benchmark": "synthetic-point-in-time-v1",
        "dataset_type": "deterministic synthetic fixture; not a real-market backtest",
        "cases_per_mode": len(cases),
        "total_runs": total_runs,
        "settlement_rate": round(total_settled / total_runs, 4),
        "overall_accuracy": round(weighted_accuracy, 4),
        "overall_brier_score": round(weighted_brier, 4),
        "audit_completeness_rate": round(total_complete / total_runs, 4),
        "point_in_time_evidence_checks": total_checks,
        "point_in_time_violations": total_violations,
        "memory_brier_improvement_vs_debate": round(memory_improvement, 4),
        "modes": modes,
    }


def render_markdown(result: dict) -> str:
    lines = [
        "# EvidenceAlpha Benchmark Report",
        "",
        "> This report uses a deterministic synthetic fixture. It validates the evaluation",
        "> pipeline and must not be presented as real-market investment performance.",
        "",
        "## Dataset and protocol",
        "",
        f"- Benchmark: `{result['benchmark']}`",
        f"- Cases per mode: {result['cases_per_mode']}",
        f"- Total analysis/settlement runs: {result['total_runs']}",
        "- Matrix: 4 symbols × 4 point-in-time snapshots × 3 horizons × 3 modes",
        "",
        "## Results",
        "",
        "| Mode | Runs | Accuracy | Brier Score | Calibration Gap | PIT violations |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for item in result["modes"]:
        lines.append(
            f"| {item['mode']} | {item['runs']} | {item['accuracy']:.2%} | "
            f"{item['brier_score']:.4f} | {item['calibration_gap']:.4f} | "
            f"{item['point_in_time_violations']} |"
        )
    lines.extend(
        [
            "",
            f"- Overall direction accuracy: **{result['overall_accuracy']:.2%}**",
            f"- Overall Brier Score: **{result['overall_brier_score']:.4f}**",
            f"- Settled predictions: **{result['settlement_rate']:.2%}**",
            f"- Auditable complete runs: **{result['audit_completeness_rate']:.2%}**",
            f"- Point-in-time evidence checks: **{result['point_in_time_evidence_checks']}**",
            f"- Future-evidence violations: **{result['point_in_time_violations']}**",
            "- Debate+Memory Brier improvement vs Debate: "
            f"**{result['memory_brier_improvement_vs_debate']:.2%}**",
            "",
            "## Reproduce",
            "",
            "```bash",
            "python -m benchmarks.run_benchmark --write",
            "```",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the EvidenceAlpha offline benchmark")
    parser.add_argument("--write", action="store_true", help="write JSON and Markdown reports")
    args = parser.parse_args()
    result = run_benchmark()
    if args.write:
        output_dir = Path(__file__).parent / "results"
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "latest.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        (output_dir / "latest.md").write_text(render_markdown(result), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
