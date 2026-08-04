import os

os.environ["DATABASE_URL"] = "sqlite:///./data/runtime/test_evidence_alpha.db"
os.environ["LLM_API_KEY"] = ""

import pytest
from fastapi.testclient import TestClient

from backend.config import get_settings
from backend.database import Base, engine
from backend.main import app


@pytest.fixture(autouse=True)
def reset_database():
    get_settings.cache_clear()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
