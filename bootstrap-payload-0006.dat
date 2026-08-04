from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    external_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    symbol: Mapped[str] = mapped_column(String(20), index=True)
    title: Mapped[str] = mapped_column(String(240))
    summary: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(80))
    source_url: Mapped[str] = mapped_column(String(500), default="")
    evidence_type: Mapped[str] = mapped_column(String(40), index=True)
    stance: Mapped[str] = mapped_column(String(20), default="neutral")
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    symbol: Mapped[str] = mapped_column(String(20), index=True)
    company_name: Mapped[str] = mapped_column(String(120))
    query: Mapped[str] = mapped_column(Text)
    as_of: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    horizon_days: Mapped[int] = mapped_column(Integer)
    mode: Mapped[str] = mapped_column(String(30), default="debate")
    status: Mapped[str] = mapped_column(String(30), default="completed")
    conclusion: Mapped[str] = mapped_column(Text)
    signal: Mapped[str] = mapped_column(String(20))
    confidence: Mapped[float] = mapped_column(Float)
    expected_return_low: Mapped[float] = mapped_column(Float)
    expected_return_high: Mapped[float] = mapped_column(Float)
    invalidation_conditions: Mapped[list] = mapped_column(JSON, default=list)
    agent_trace: Mapped[list] = mapped_column(JSON, default=list)
    model_name: Mapped[str] = mapped_column(String(120), default="deterministic-demo")
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    links: Mapped[list["AnalysisEvidence"]] = relationship(
        cascade="all, delete-orphan", back_populates="analysis"
    )
    prediction: Mapped["Prediction | None"] = relationship(
        cascade="all, delete-orphan", back_populates="analysis", uselist=False
    )


class AnalysisEvidence(Base):
    __tablename__ = "analysis_evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analysis_runs.id"), index=True)
    evidence_id: Mapped[int] = mapped_column(ForeignKey("evidence.id"), index=True)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)
    used_by: Mapped[list] = mapped_column(JSON, default=list)

    analysis: Mapped[AnalysisRun] = relationship(back_populates="links")
    evidence: Mapped[Evidence] = relationship()


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analysis_runs.id"), unique=True)
    symbol: Mapped[str] = mapped_column(String(20), index=True)
    signal: Mapped[str] = mapped_column(String(20))
    confidence: Mapped[float] = mapped_column(Float)
    horizon_days: Mapped[int] = mapped_column(Integer)
    benchmark: Mapped[str] = mapped_column(String(40), default="000300")
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    settled: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    actual_return: Mapped[float | None] = mapped_column(Float, nullable=True)
    benchmark_return: Mapped[float | None] = mapped_column(Float, nullable=True)
    excess_return: Mapped[float | None] = mapped_column(Float, nullable=True)
    correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    brier_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    reflection: Mapped[str | None] = mapped_column(Text, nullable=True)
    settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    analysis: Mapped[AnalysisRun] = relationship(back_populates="prediction")

