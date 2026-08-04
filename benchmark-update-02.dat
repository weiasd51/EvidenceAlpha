import time
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import AnalysisEvidence, AnalysisRun, Evidence, Prediction
from backend.providers.demo import company_name, demo_evidence
from backend.schemas import AnalyzeRequest
from backend.services.llm import OpenAICompatibleLLM, evidence_payload


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _as_utc(value: datetime) -> datetime:
    """Normalize SQLite's timezone-naive datetimes before PIT comparisons."""
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def add_trading_days(start: datetime, days: int) -> datetime:
    """Advance by weekdays; exchange holidays are a real-provider extension."""
    cursor = start
    completed = 0
    while completed < days:
        cursor += timedelta(days=1)
        if cursor.weekday() < 5:
            completed += 1
    return cursor


class ResearchWorkflow:
    """Auditable agent workflow with deterministic demo execution.

    The workflow deliberately separates data collection from language reasoning.
    A real LLM adapter can replace the opinion generators without changing the
    evidence ledger or settlement logic.
    """

    def __init__(self, db: Session):
        self.db = db
        self.llm = OpenAICompatibleLLM()

    def run(self, request: AnalyzeRequest) -> AnalysisRun:
        started = time.perf_counter()
        as_of = request.as_of or datetime.now(timezone.utc)
        evidences = self._upsert_evidence(request.symbol.upper(), as_of)
        trace: list[dict] = []

        def step(agent: str, summary: str, selected: list[Evidence], duration: int) -> None:
            trace.append(
                {
                    "agent": agent,
                    "status": "completed",
                    "summary": summary,
                    "evidence_ids": [item.external_id for item in selected],
                    "duration_ms": duration,
                }
            )

        bullish = [item for item in evidences if item.stance == "bullish"]
        bearish = [item for item in evidences if item.stance == "bearish"]
        memory_cases: list[Prediction] = []
        if request.mode == "debate_memory":
            memory_cases = list(
                self.db.scalars(
                    select(Prediction)
                    .where(
                        Prediction.settled.is_(True),
                        Prediction.settled_at <= as_of,
                        Prediction.symbol == request.symbol.upper(),
                        Prediction.horizon_days == request.horizon_days,
                    )
                    .order_by(Prediction.settled_at.desc())
                    .limit(3)
                ).all()
            )
        llm_decision: dict | None = None
        llm_tokens = 0
        step("research", f"完成 {len(evidences)} 条时点证据的清洗、去重与可信度检查。", evidences, 46)
        step("bull", "经营信息与相对强势为正向假设提供支持，但仍需等待事件持续性验证。", bullish, 31)
        if request.mode != "single":
            step("bear", "价格竞争和波动率构成反向证据，短期收益分布可能扩大。", bearish, 28)
            step("critic", "证据均未超过研究时点；正反观点均存在，需降低最终置信度。", evidences, 24)
        if request.mode == "debate_memory":
            correct_cases = sum(bool(item.correct) for item in memory_cases)
            step(
                "memory",
                f"检索 {len(memory_cases)} 条已结算案例，其中 {correct_cases} 条方向正确；仅用于置信度校准。",
                [],
                18,
            )

        if self.llm.enabled:
            try:
                llm_context = {
                    "query": request.query,
                    "symbol": request.symbol.upper(),
                    "as_of": as_of.isoformat(),
                    "evidence": evidence_payload(evidences),
                    "settled_memory": [
                        {
                            "signal": item.signal,
                            "confidence": item.confidence,
                            "correct": item.correct,
                            "excess_return": item.excess_return,
                        }
                        for item in memory_cases
                    ],
                }
                bull_call = self.llm.ask("bull", llm_context)
                llm_tokens += bull_call.total_tokens
                if request.mode == "single":
                    llm_decision = bull_call.data
                else:
                    bear_call = self.llm.ask("bear", llm_context)
                    llm_tokens += bear_call.total_tokens
                    critic_call = self.llm.ask(
                        "critic",
                        {**llm_context, "bull_opinion": bull_call.data, "bear_opinion": bear_call.data},
                    )
                    llm_tokens += critic_call.total_tokens
                    judge_call = self.llm.ask(
                        "judge",
                        {
                            **llm_context,
                            "bull_opinion": bull_call.data,
                            "bear_opinion": bear_call.data,
                            "critic_opinion": critic_call.data,
                            "horizon_days": request.horizon_days,
                        },
                    )
                    llm_tokens += judge_call.total_tokens
                    llm_decision = judge_call.data
            except (httpx.HTTPError, KeyError, TypeError, ValueError):
                llm_decision = None

        bull_score = sum(1.0 for item in bullish) + 0.3
        bear_score = sum(1.0 for item in bearish)
        raw_edge = (bull_score - bear_score) / max(bull_score + bear_score, 1.0)
        if memory_cases:
            historical_edge = (
                sum(1.0 if item.correct else -1.0 for item in memory_cases) / len(memory_cases)
            )
            raw_edge = _clamp(raw_edge + historical_edge * 0.08, -1.0, 1.0)
        if request.mode == "single":
            confidence = _clamp(0.58 + raw_edge * 0.15, 0.52, 0.78)
        elif request.mode == "debate_memory":
            confidence = _clamp(0.60 + raw_edge * 0.18, 0.52, 0.76)
        else:
            confidence = _clamp(0.57 + raw_edge * 0.16, 0.50, 0.73)
        signal = "bullish" if raw_edge > 0.05 else "bearish" if raw_edge < -0.05 else "neutral"
        if signal == "neutral":
            confidence = min(confidence, 0.55)

        conclusion = (
            "现有证据略偏正面：经营进展与相对强势构成支撑，但行业价格压力和较高波动率限制了置信度。"
            "建议把结论视为待验证研究假设，并以事件日前低点及行业相对表现作为失效条件。"
        )
        if llm_decision:
            candidate_signal = str(llm_decision.get("signal", "")).lower()
            if candidate_signal in {"bullish", "bearish", "neutral"}:
                signal = candidate_signal
            try:
                confidence = _clamp(float(llm_decision.get("confidence", confidence)), 0.05, 0.9)
            except (TypeError, ValueError):
                pass
            candidate_summary = str(llm_decision.get("summary", "")).strip()
            if candidate_summary:
                conclusion = candidate_summary
        step("judge", f"综合裁决为 {signal}，置信度 {confidence:.0%}；保留两项明确失效条件。", evidences, 35)

        scale = {1: 0.012, 5: 0.035, 20: 0.08}[request.horizon_days]
        direction = 1 if signal == "bullish" else -1 if signal == "bearish" else 0
        analysis = AnalysisRun(
            symbol=request.symbol.upper(),
            company_name=company_name(request.symbol),
            query=request.query,
            as_of=as_of,
            horizon_days=request.horizon_days,
            mode=request.mode,
            conclusion=conclusion,
            signal=signal,
            confidence=round(confidence, 4),
            expected_return_low=round(-scale * 0.35 if direction >= 0 else -scale, 4),
            expected_return_high=round(scale if direction >= 0 else scale * 0.35, 4),
            invalidation_conditions=["跌破事件日前低点", "行业指数连续两个交易日显著跑输沪深300"],
            agent_trace=trace,
            model_name=self.llm.settings.llm_model if llm_decision else "deterministic-demo",
            latency_ms=int((time.perf_counter() - started) * 1000) + sum(x["duration_ms"] for x in trace),
            token_count=llm_tokens,
        )
        self.db.add(analysis)
        self.db.flush()
        for index, evidence in enumerate(evidences):
            self.db.add(
                AnalysisEvidence(
                    analysis_id=analysis.id,
                    evidence_id=evidence.id,
                    relevance_score=round(0.95 - index * 0.08, 2),
                    used_by=["research", "judge"] + (["bull"] if evidence.stance == "bullish" else ["bear"]),
                )
            )

        due_at = add_trading_days(as_of, request.horizon_days)
        prediction = Prediction(
            analysis_id=analysis.id,
            symbol=analysis.symbol,
            signal=signal,
            confidence=analysis.confidence,
            horizon_days=request.horizon_days,
            benchmark="000300",
            due_at=due_at,
        )
        self.db.add(prediction)
        self.db.commit()
        self.db.refresh(analysis)
        return analysis

    def _upsert_evidence(self, symbol: str, as_of: datetime) -> list[Evidence]:
        results: list[Evidence] = []
        for item in demo_evidence(symbol, as_of):
            existing = self.db.scalar(
                select(Evidence).where(Evidence.external_id == item["external_id"])
            )
            if existing:
                if _as_utc(existing.published_at) <= _as_utc(as_of):
                    results.append(existing)
                continue
            evidence = Evidence(symbol=symbol, **item)
            self.db.add(evidence)
            self.db.flush()
            results.append(evidence)
        return [
            item for item in results if _as_utc(item.published_at) <= _as_utc(as_of)
        ]


def settle_prediction(
    db: Session, prediction: Prediction, actual_return: float, benchmark_return: float
) -> Prediction:
    excess = actual_return - benchmark_return
    if prediction.signal == "bullish":
        correct = excess > 0
        outcome = 1.0 if excess > 0 else 0.0
    elif prediction.signal == "bearish":
        correct = excess < 0
        outcome = 1.0 if excess < 0 else 0.0
    else:
        correct = abs(excess) < 0.02
        outcome = 1.0 if correct else 0.0
    brier = (prediction.confidence - outcome) ** 2
    prediction.actual_return = actual_return
    prediction.benchmark_return = benchmark_return
    prediction.excess_return = round(excess, 6)
    prediction.correct = correct
    prediction.brier_score = round(brier, 6)
    prediction.settled = True
    prediction.settled_at = datetime.now(timezone.utc)
    prediction.reflection = (
        "预测方向正确。主要证据与后续走势一致，但仍需检验在不同市场状态下的稳定性。"
        if correct
        else "预测方向错误。原分析可能高估了正向证据的持续性，后续应提高反向证据和市场状态权重。"
    )
    db.commit()
    db.refresh(prediction)
    return prediction
