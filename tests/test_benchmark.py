from benchmarks.run_benchmark import run_benchmark


def test_synthetic_benchmark_is_reproducible_and_auditable():
    result = run_benchmark()

    assert result["cases_per_mode"] == 48
    assert result["total_runs"] == 144
    assert result["settlement_rate"] == 1.0
    assert result["audit_completeness_rate"] == 1.0
    assert result["point_in_time_evidence_checks"] == 576
    assert result["point_in_time_violations"] == 0
    assert result["overall_accuracy"] == 0.6667
    assert result["overall_brier_score"] == 0.2197
    assert result["memory_brier_improvement_vs_debate"] == 0.122
    assert result["modes"][2]["brier_score"] == 0.2015
