from backend.models import AnalysisRun


def serialize_analysis(analysis: AnalysisRun) -> dict:
    return {
        "id": analysis.id,
        "symbol": analysis.symbol,
        "company_name": analysis.company_name,
        "query": analysis.query,
        "as_of": analysis.as_of,
        "horizon_days": analysis.horizon_days,
        "mode": analysis.mode,
        "status": analysis.status,
        "conclusion": analysis.conclusion,
        "signal": analysis.signal,
        "confidence": analysis.confidence,
        "expected_return_low": analysis.expected_return_low,
        "expected_return_high": analysis.expected_return_high,
        "invalidation_conditions": analysis.invalidation_conditions,
        "agent_trace": analysis.agent_trace,
        "model_name": analysis.model_name,
        "latency_ms": analysis.latency_ms,
        "token_count": analysis.token_count,
        "evidence": [link.evidence for link in analysis.links],
        "prediction": analysis.prediction,
    }

