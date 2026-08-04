from datetime import datetime, timedelta


COMPANIES = {
    "300750": "宁德时代",
    "600519": "贵州茅台",
    "000858": "五粮液",
    "601318": "中国平安",
}


def company_name(symbol: str) -> str:
    return COMPANIES.get(symbol.upper(), symbol.upper())


def demo_evidence(symbol: str, as_of: datetime) -> list[dict]:
    """Return deterministic evidence whose publish time never exceeds as_of."""
    name = company_name(symbol)
    # Freeze a synthetic snapshot to the hour so repeated runs are stable while
    # historical and current research never share the same external IDs.
    snapshot = as_of.replace(minute=0, second=0, microsecond=0)
    snapshot_id = snapshot.strftime("%Y%m%dT%H")
    items = [
        {
            "external_id": f"{symbol}-{snapshot_id}-announcement-01",
            "title": f"{name}发布经营进展公告",
            "summary": "核心业务保持增长，但管理层提示行业竞争和价格变化仍需持续观察。",
            "source": "交易所公告（演示）",
            "source_url": "https://example.com/announcement",
            "evidence_type": "announcement",
            "stance": "bullish",
            "published_at": snapshot - timedelta(days=2),
            "payload": {"revenue_yoy": 0.18, "point_in_time": True},
        },
        {
            "external_id": f"{symbol}-{snapshot_id}-market-01",
            "title": f"{name}近20日相对行业指数表现",
            "summary": "近20个交易日上涨6.2%，相对行业指数取得2.8个百分点超额收益，成交活跃度温和上升。",
            "source": "行情聚合（演示）",
            "source_url": "https://example.com/market",
            "evidence_type": "market",
            "stance": "bullish",
            "published_at": snapshot - timedelta(hours=3),
            "payload": {"return_20d": 0.062, "excess_20d": 0.028, "volume_ratio": 1.14},
        },
        {
            "external_id": f"{symbol}-{snapshot_id}-news-01",
            "title": "行业价格竞争加剧",
            "summary": "产业链近期出现价格压力，市场担忧短期毛利率承压，影响程度仍取决于成本下降速度。",
            "source": "行业新闻（演示）",
            "source_url": "https://example.com/news",
            "evidence_type": "news",
            "stance": "bearish",
            "published_at": snapshot - timedelta(days=1, hours=4),
            "payload": {"risk": "margin_pressure", "point_in_time": True},
        },
        {
            "external_id": f"{symbol}-{snapshot_id}-risk-01",
            "title": "短期波动率处于历史中高区间",
            "summary": "20日年化波动率为31%，事件窗口内价格波动可能明显放大，应设置失效条件。",
            "source": "风险模型（演示）",
            "source_url": "https://example.com/risk",
            "evidence_type": "risk",
            "stance": "bearish",
            "published_at": snapshot - timedelta(hours=2),
            "payload": {"volatility_20d": 0.31, "percentile": 0.72},
        },
    ]
    return [item for item in items if item["published_at"] <= as_of]
