from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


Signal = Literal["bullish", "bearish", "neutral"]
Mode = Literal["single", "debate", "debate_memory"]


class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    external_id: str
    symbol: str
    title: str
    summary: str
    source: str
    source_url: str
    evidence_type: str
    stance: str
    published_at: datetime


class AnalyzeRequest(BaseModel):
    symbol: str = Field(default="300750", min_length=2, max_length=20)
    query: str = Field(default="评估近期重要事件对未来走势的影响", min_length=4, max_length=500)
    horizon_days: Literal[1, 5, 20] = 5
    mode: Mode = "debate"
    as_of: datetime | None = None


class AgentStep(BaseModel):
    agent: str
    status: str
    summary: str
    evidence_ids: list[str] = []
    duration_ms: int


class PredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    analysis_id: int
    symbol: str
    signal: str
    confidence: float
    horizon_days: int
    benchmark: str
    due_at: datetime
    settled: bool
    actual_return: float | None
    benchmark_return: float | None
    excess_return: float | None
    correct: bool | None
    brier_score: float | None
    reflection: str | None
    created_at: datetime


class AnalysisOut(BaseModel):
    id: int
    symbol: str
    company_name: str
    query: str
    as_of: datetime
    horizon_days: int
    mode: str
    status: str
    conclusion: str
    signal: str
    confidence: float
    expected_return_low: float
    expected_return_high: float
    invalidation_conditions: list[str]
    agent_trace: list[AgentStep]
    model_name: str
    latency_ms: int
    token_count: int
    evidence: list[EvidenceOut]
    prediction: PredictionOut


class SettlementRequest(BaseModel):
    actual_return: float = Field(ge=-1.0, le=10.0)
    benchmark_return: float = Field(default=0.0, ge=-1.0, le=10.0)


class MetricsOut(BaseModel):
    total_predictions: int
    settled_predictions: int
    accuracy: float
    average_brier_score: float
    average_excess_return: float
    calibration_gap: float
    modes: list[dict]


class DashboardOut(BaseModel):
    metrics: MetricsOut
    recent_analyses: list[AnalysisOut]
    evidence_count: int
    unsettled_count: int

