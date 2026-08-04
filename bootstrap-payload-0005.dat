from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from backend.config import get_settings
from backend.database import get_db, init_db
from backend.models import AnalysisEvidence, AnalysisRun, Evidence, Prediction
from backend.schemas import (
    AnalysisOut,
    AnalyzeRequest,
    DashboardOut,
    EvidenceOut,
    MetricsOut,
    PredictionOut,
    SettlementRequest,
)
from backend.serializers import serialize_analysis
from backend.services.metrics import calculate_metrics
from backend.services.workflow import ResearchWorkflow, settle_prediction


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Evidence-grounded A-share research and evaluation system.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def analysis_query():
    return select(AnalysisRun).options(
        joinedload(AnalysisRun.links).joinedload(AnalysisEvidence.evidence),
        joinedload(AnalysisRun.prediction),
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": settings.app_name, "environment": settings.app_env}


@app.post("/api/v1/analyses", response_model=AnalysisOut, status_code=201)
def create_analysis(request: AnalyzeRequest, db: Session = Depends(get_db)):
    result = ResearchWorkflow(db).run(request)
    result = db.execute(analysis_query().where(AnalysisRun.id == result.id)).unique().scalar_one()
    return serialize_analysis(result)


@app.get("/api/v1/analyses", response_model=list[AnalysisOut])
def list_analyses(limit: int = Query(default=10, ge=1, le=50), db: Session = Depends(get_db)):
    items = (
        db.execute(analysis_query().order_by(AnalysisRun.created_at.desc()).limit(limit))
        .unique()
        .scalars()
        .all()
    )
    return [serialize_analysis(item) for item in items]


@app.get("/api/v1/analyses/{analysis_id}", response_model=AnalysisOut)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    item = db.execute(analysis_query().where(AnalysisRun.id == analysis_id)).unique().scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="analysis not found")
    return serialize_analysis(item)


@app.get("/api/v1/evidence", response_model=list[EvidenceOut])
def list_evidence(
    symbol: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = select(Evidence).order_by(Evidence.published_at.desc()).limit(limit)
    if symbol:
        query = query.where(Evidence.symbol == symbol.upper())
    return list(db.scalars(query).all())


@app.get("/api/v1/predictions", response_model=list[PredictionOut])
def list_predictions(db: Session = Depends(get_db)):
    return list(db.scalars(select(Prediction).order_by(Prediction.created_at.desc())).all())


@app.post("/api/v1/predictions/{prediction_id}/settle", response_model=PredictionOut)
def settle(prediction_id: int, payload: SettlementRequest, db: Session = Depends(get_db)):
    prediction = db.get(Prediction, prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="prediction not found")
    return settle_prediction(db, prediction, payload.actual_return, payload.benchmark_return)


@app.get("/api/v1/metrics", response_model=MetricsOut)
def metrics(db: Session = Depends(get_db)):
    return calculate_metrics(db)


@app.get("/api/v1/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    items = (
        db.execute(analysis_query().order_by(AnalysisRun.created_at.desc()).limit(5))
        .unique()
        .scalars()
        .all()
    )
    evidence_count = db.scalar(select(func.count()).select_from(Evidence)) or 0
    unsettled_count = (
        db.scalar(select(func.count()).select_from(Prediction).where(Prediction.settled.is_(False))) or 0
    )
    return {
        "metrics": calculate_metrics(db),
        "recent_analyses": [serialize_analysis(item) for item in items],
        "evidence_count": evidence_count,
        "unsettled_count": unsettled_count,
    }

