from backend.database import SessionLocal, init_db
from backend.schemas import AnalyzeRequest
from backend.services.workflow import ResearchWorkflow, settle_prediction


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        if db.query(__import__("backend.models", fromlist=["AnalysisRun"]).AnalysisRun).count():
            return
        samples = [
            ("300750", "debate", 0.041, 0.012),
            ("600519", "single", -0.008, 0.004),
            ("000858", "debate_memory", 0.026, 0.009),
        ]
        for symbol, mode, actual, benchmark in samples:
            analysis = ResearchWorkflow(db).run(
                AnalyzeRequest(symbol=symbol, horizon_days=5, mode=mode)
            )
            settle_prediction(db, analysis.prediction, actual, benchmark)
        ResearchWorkflow(db).run(AnalyzeRequest(symbol="601318", horizon_days=20, mode="debate"))
    finally:
        db.close()


if __name__ == "__main__":
    seed()
