def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_analysis_creates_evidence_and_prediction(client):
    response = client.post(
        "/api/v1/analyses",
        json={
            "symbol": "300750",
            "query": "分析近期事件",
            "horizon_days": 5,
            "mode": "debate",
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["company_name"] == "宁德时代"
    assert len(payload["evidence"]) == 4
    assert payload["prediction"]["settled"] is False
    assert [step["agent"] for step in payload["agent_trace"]] == [
        "research",
        "bull",
        "bear",
        "critic",
        "judge",
    ]


def test_prediction_settlement_updates_metrics(client):
    analysis = client.post(
        "/api/v1/analyses",
        json={"symbol": "600519", "query": "分析事件影响", "horizon_days": 5, "mode": "single"},
    ).json()
    prediction_id = analysis["prediction"]["id"]
    settled = client.post(
        f"/api/v1/predictions/{prediction_id}/settle",
        json={"actual_return": 0.05, "benchmark_return": 0.01},
    )
    assert settled.status_code == 200
    assert settled.json()["correct"] is True
    metrics = client.get("/api/v1/metrics").json()
    assert metrics["settled_predictions"] == 1
    assert metrics["accuracy"] == 1.0


def test_point_in_time_never_returns_future_evidence(client):
    result = client.post(
        "/api/v1/analyses",
        json={
            "symbol": "300750",
            "query": "历史时点回放",
            "horizon_days": 1,
            "mode": "debate",
            "as_of": "2025-03-01T08:00:00Z",
        },
    ).json()
    assert all(item["published_at"] <= result["as_of"] for item in result["evidence"])


def test_historical_run_does_not_reuse_future_evidence(client):
    current = client.post(
        "/api/v1/analyses",
        json={
            "symbol": "300750",
            "query": "当前时点分析",
            "horizon_days": 5,
            "mode": "debate",
            "as_of": "2026-08-04T08:00:00Z",
        },
    )
    assert current.status_code == 201

    historical = client.post(
        "/api/v1/analyses",
        json={
            "symbol": "300750",
            "query": "历史时点回放",
            "horizon_days": 5,
            "mode": "debate",
            "as_of": "2025-03-01T08:00:00Z",
        },
    )
    assert historical.status_code == 201
    result = historical.json()
    assert len(result["evidence"]) == 4
    assert all(item["published_at"] <= result["as_of"] for item in result["evidence"])
