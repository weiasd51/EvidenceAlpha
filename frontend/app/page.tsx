"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Evidence = {
  external_id: string;
  title: string;
  summary: string;
  source: string;
  evidence_type: string;
  stance: string;
  published_at: string;
};

type AgentStep = {
  agent: string;
  status: string;
  summary: string;
  evidence_ids: string[];
  duration_ms: number;
};

type Prediction = {
  id: number;
  signal: string;
  confidence: number;
  horizon_days: number;
  due_at: string;
  settled: boolean;
  correct: boolean | null;
  excess_return: number | null;
  brier_score: number | null;
};

type Analysis = {
  id: number;
  symbol: string;
  company_name: string;
  query: string;
  as_of: string;
  horizon_days: number;
  mode: string;
  conclusion: string;
  signal: string;
  confidence: number;
  expected_return_low: number;
  expected_return_high: number;
  invalidation_conditions: string[];
  agent_trace: AgentStep[];
  evidence: Evidence[];
  prediction: Prediction;
  latency_ms: number;
};

type Metrics = {
  total_predictions: number;
  settled_predictions: number;
  accuracy: number;
  average_brier_score: number;
  average_excess_return: number;
  calibration_gap: number;
  modes: Array<{ mode: string; count: number; accuracy: number; brier_score: number }>;
};

type Dashboard = {
  metrics: Metrics;
  recent_analyses: Analysis[];
  evidence_count: number;
  unsettled_count: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const demoAnalysis: Analysis = {
  id: 0,
  symbol: "300750",
  company_name: "宁德时代",
  query: "评估近期重要事件对未来走势的影响",
  as_of: new Date().toISOString(),
  horizon_days: 5,
  mode: "debate",
  conclusion:
    "现有证据略偏正面：经营进展与相对强势构成支撑，但行业价格压力和较高波动率限制了置信度。结论应被视为待验证的研究假设。",
  signal: "bullish",
  confidence: 0.61,
  expected_return_low: -0.012,
  expected_return_high: 0.035,
  invalidation_conditions: ["跌破事件日前低点", "行业指数连续两个交易日显著跑输沪深300"],
  latency_ms: 164,
  evidence: [
    {
      external_id: "300750-announcement-01",
      title: "宁德时代发布经营进展公告",
      summary: "核心业务保持增长，但管理层提示行业竞争和价格变化仍需持续观察。",
      source: "交易所公告（演示）",
      evidence_type: "公告",
      stance: "bullish",
      published_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      external_id: "300750-market-01",
      title: "近20日相对行业指数表现",
      summary: "股价取得2.8个百分点超额收益，成交活跃度温和上升。",
      source: "行情聚合（演示）",
      evidence_type: "行情",
      stance: "bullish",
      published_at: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      external_id: "300750-news-01",
      title: "行业价格竞争加剧",
      summary: "产业链价格压力可能使短期毛利率承压。",
      source: "行业新闻（演示）",
      evidence_type: "新闻",
      stance: "bearish",
      published_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  agent_trace: [
    { agent: "research", status: "completed", summary: "完成时点证据清洗与可信度检查。", evidence_ids: ["01", "02", "03"], duration_ms: 46 },
    { agent: "bull", status: "completed", summary: "经营信息与相对强势支持正向假设。", evidence_ids: ["01", "02"], duration_ms: 31 },
    { agent: "bear", status: "completed", summary: "价格竞争与高波动率构成反向证据。", evidence_ids: ["03"], duration_ms: 28 },
    { agent: "critic", status: "completed", summary: "正反观点均成立，建议降低最终置信度。", evidence_ids: ["01", "03"], duration_ms: 24 },
    { agent: "judge", status: "completed", summary: "裁决为偏多，并保留明确失效条件。", evidence_ids: ["01", "02", "03"], duration_ms: 35 },
  ],
  prediction: {
    id: 0,
    signal: "bullish",
    confidence: 0.61,
    horizon_days: 5,
    due_at: new Date(Date.now() + 432000000).toISOString(),
    settled: false,
    correct: null,
    excess_return: null,
    brier_score: null,
  },
};

const demoDashboard: Dashboard = {
  metrics: {
    total_predictions: 4,
    settled_predictions: 3,
    accuracy: 0.667,
    average_brier_score: 0.228,
    average_excess_return: 0.011,
    calibration_gap: 0.043,
    modes: [
      { mode: "single", count: 1, accuracy: 0, brier_score: 0.39 },
      { mode: "debate", count: 1, accuracy: 1, brier_score: 0.15 },
      { mode: "debate_memory", count: 1, accuracy: 1, brier_score: 0.14 },
    ],
  },
  recent_analyses: [demoAnalysis],
  evidence_count: 16,
  unsettled_count: 1,
};

const signalLabel: Record<string, string> = {
  bullish: "偏多",
  bearish: "偏空",
  neutral: "中性",
};

function pct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Home() {
  const [dashboard, setDashboard] = useState<Dashboard>(demoDashboard);
  const [analysis, setAnalysis] = useState<Analysis>(demoAnalysis);
  const [symbol, setSymbol] = useState("300750");
  const [horizon, setHorizon] = useState("5");
  const [mode, setMode] = useState("debate");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState("当前展示内置演示数据，启动后端后会自动切换为真实本地数据。 ");

  async function refresh() {
    try {
      const response = await fetch(`${API_URL}/api/v1/dashboard`);
      if (!response.ok) throw new Error("dashboard unavailable");
      const data: Dashboard = await response.json();
      setDashboard(data);
      if (data.recent_analyses.length) setAnalysis(data.recent_analyses[0]);
      setConnected(true);
      setNotice("本地后端已连接，所有预测与证据将写入预测账本。");
    } catch {
      setConnected(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/analyses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          query: "评估近期重要事件对未来走势的影响",
          horizon_days: Number(horizon),
          mode,
        }),
      });
      if (!response.ok) throw new Error("analysis failed");
      const result: Analysis = await response.json();
      setAnalysis(result);
      await refresh();
      setAnalysis(result);
      setNotice(`分析 #${result.id} 已写入不可修改的预测账本。`);
    } catch {
      setNotice("后端尚未启动，已保留演示结果。请按 README 启动本地服务。");
    } finally {
      setLoading(false);
    }
  }

  const experimentBest = useMemo(() => {
    const modes = dashboard.metrics.modes;
    return modes.length ? [...modes].sort((a, b) => b.accuracy - a.accuracy)[0] : null;
  }, [dashboard.metrics.modes]);

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">EA</span>
          <div>
            <strong>EvidenceAlpha</strong>
            <span>证据驱动智能投研</span>
          </div>
        </div>
        <nav aria-label="主要导航">
          <a href="#research">研究台</a>
          <a href="#evidence">证据链</a>
          <a href="#evaluation">评测</a>
        </nav>
        <div className={`status ${connected ? "online" : "demo"}`}>
          <i /> {connected ? "本地服务已连接" : "演示模式"}
        </div>
      </header>

      <section className="hero" id="research">
        <div className="hero-copy">
          <p className="eyebrow">POINT-IN-TIME RESEARCH SYSTEM</p>
          <h1>让每一个投研结论，<br />都有证据和结果。</h1>
          <p className="lede">
            研究时点冻结、正反观点交叉质疑、预测到期自动结算。系统不承诺收益，只负责让研究过程可追溯、可复现、可评测。
          </p>
        </div>
        <form className="research-box" onSubmit={submit}>
          <div className="command-label"><span>新建研究任务</span><span className="step-mark">01 / 研究参数</span></div>
          <label>
            股票代码或名称
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              aria-label="股票代码或名称"
              list="stock-options"
              placeholder="例如：300750"
            />
            <datalist id="stock-options">
              <option value="300750">宁德时代</option>
              <option value="600519">贵州茅台</option>
              <option value="000858">五粮液</option>
              <option value="601318">中国平安</option>
            </datalist>
            <small className="field-help">可直接修改；演示版内置 4 只股票，也允许输入其他 6 位 A 股代码。</small>
          </label>
          <div className="field-row">
            <label>
              研究期限
              <select aria-label="研究期限" value={horizon} onChange={(e) => setHorizon(e.target.value)}>
                <option value="1">T+1｜下一交易日</option>
                <option value="5">T+5｜未来一周</option>
                <option value="20">T+20｜未来一月</option>
              </select>
            </label>
            <label>
              分析方式
              <select aria-label="分析方式" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="single">单 Agent｜快速基线</option>
                <option value="debate">多空辩论｜推荐</option>
                <option value="debate_memory">辩论 + 历史记忆｜进阶</option>
              </select>
            </label>
          </div>
          <div className="parameter-explainers">
            <div><b>T+{horizon}</b><span>判断 {horizon} 个交易日后相对沪深300的方向</span></div>
            <div><b>{mode === "single" ? "单 Agent" : mode === "debate" ? "多空辩论" : "辩论 + 记忆"}</b><span>{mode === "single" ? "一个研究员直接生成结论" : "看多、看空、质疑和裁决分工完成"}</span></div>
            <div><b>时点研究</b><span>只使用点击分析这一刻以前已经公开的信息</span></div>
          </div>
          <button type="submit" disabled={loading}>{loading ? "正在构建证据链…" : "生成研究报告与预测卡 →"}</button>
          <p className="form-note">输出：方向假设、置信度、证据引用、失效条件和待结算预测。仅用于系统评测。</p>
        </form>
      </section>

      <div className="notice"><span>运行状态</span>{notice}</div>

      <section className="metrics-grid" aria-label="核心指标">
        <Metric label="已登记预测" value={String(dashboard.metrics.total_predictions)} detail={`${dashboard.unsettled_count} 条等待结算`} />
        <Metric label="方向准确率" value={pct(dashboard.metrics.accuracy)} detail={`${dashboard.metrics.settled_predictions} 条已结算`} positive />
        <Metric label="Brier Score" value={dashboard.metrics.average_brier_score.toFixed(3)} detail="越低代表校准越好" />
        <Metric label="证据资产" value={String(dashboard.evidence_count)} detail="均保留发布时间" />
      </section>

      <section className="workspace">
        <article className="decision-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LATEST RESEARCH CARD</p>
              <h2>{analysis.company_name} <span>{analysis.symbol}</span></h2>
            </div>
            <div className={`signal ${analysis.signal}`}>{signalLabel[analysis.signal] || analysis.signal}</div>
          </div>
          <div className="confidence-row">
            <div>
              <small>裁决置信度</small>
              <strong>{pct(analysis.confidence, 0)}</strong>
            </div>
            <div className="confidence-track"><i style={{ width: pct(analysis.confidence) }} /></div>
            <span>T+{analysis.horizon_days}</span>
          </div>
          <div className="output-definition">
            <span>这是什么？</span>
            <p>这是系统基于当前可见证据生成的 <b>T+{analysis.horizon_days} 研究假设</b>，不是买卖指令。到期后系统会用实际相对收益自动判断对错。</p>
          </div>
          <p className="conclusion">{analysis.conclusion}</p>
          <div className="range-row">
            <div><small>预期区间</small><strong>{pct(analysis.expected_return_low)} — {pct(analysis.expected_return_high)}</strong></div>
            <div><small>研究时点</small><strong>{dateTime(analysis.as_of)}</strong></div>
            <div><small>执行延迟</small><strong>{analysis.latency_ms} ms</strong></div>
          </div>
          <div className="risk-box">
            <span>失效条件</span>
            <ul>{analysis.invalidation_conditions.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </article>

        <aside className="trace-panel">
          <div className="section-heading compact">
            <div><p className="eyebrow">AUDIT TRAIL</p><h2>Agent 调用链</h2></div>
            <span className="run-id">RUN #{analysis.id || "DEMO"}</span>
          </div>
          <ol className="trace-list">
            {analysis.agent_trace.map((step, index) => (
              <li key={`${step.agent}-${index}`}>
                <span className="trace-index">{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{step.agent}</strong><p>{step.summary}</p></div>
                <time>{step.duration_ms}ms</time>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="evidence-section" id="evidence">
        <div className="section-heading">
          <div><p className="eyebrow">EVIDENCE LEDGER</p><h2>决策证据链</h2></div>
          <p>系统只允许 Agent 使用研究时点之前发布的信息。</p>
        </div>
        <div className="evidence-list">
          {analysis.evidence.map((item, index) => (
            <article key={item.external_id}>
              <span className={`stance-dot ${item.stance}`} />
              <div className="evidence-main">
                <div><span className="type-tag">{item.evidence_type}</span><time>{dateTime(item.published_at)}</time></div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </div>
              <div className="evidence-source"><small>来源</small><strong>{item.source}</strong><span>EV-{String(index + 1).padStart(3, "0")}</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="evaluation-section" id="evaluation">
        <div className="section-heading">
          <div><p className="eyebrow">ABLATION LAB</p><h2>不是“看起来聪明”，而是可比较</h2></div>
          <p>相同样本、相同证据，对比不同 Agent 模式。</p>
        </div>
        <div className="evaluation-grid">
          <div className="experiment-table">
            <div className="table-head"><span>实验模式</span><span>样本</span><span>准确率</span><span>Brier</span></div>
            {dashboard.metrics.modes.length ? dashboard.metrics.modes.map((item) => (
              <div className="table-row" key={item.mode}>
                <strong>{item.mode.replaceAll("_", " + ")}</strong>
                <span>{item.count}</span><span>{pct(item.accuracy)}</span><span>{item.brier_score.toFixed(3)}</span>
              </div>
            )) : <div className="empty-row">结算预测后生成实验对比</div>}
          </div>
          <div className="experiment-callout">
            <p className="eyebrow">CURRENT FINDING</p>
            <strong>{experimentBest ? experimentBest.mode.replaceAll("_", " + ") : "等待样本"}</strong>
            <p>{experimentBest ? `当前样本中准确率为 ${pct(experimentBest.accuracy)}。样本量较小，结论仅用于验证评测链路。` : "完成至少一条预测结算后，这里会显示当前表现最优的模式。"}</p>
            <div><span>平均超额收益</span><b>{pct(dashboard.metrics.average_excess_return)}</b></div>
            <div><span>校准差距</span><b>{pct(dashboard.metrics.calibration_gap)}</b></div>
          </div>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">EA</span><strong>EvidenceAlpha</strong></div>
        <p>Research with evidence. Learn from outcomes.</p>
        <span>仅供研究与工程学习，不构成投资建议。</span>
      </footer>
    </main>
  );
}

function Metric({ label, value, detail, positive = false }: { label: string; value: string; detail: string; positive?: boolean }) {
  return <article><span>{label}</span><strong className={positive ? "positive" : ""}>{value}</strong><small>{detail}</small></article>;
}
