# EvidenceAlpha 架构说明

## 设计目标

EvidenceAlpha 不把大模型输出当作事实，而是把每次研究建模为可审计记录：研究时点、证据、观点、裁决、预测和实际结果必须能够互相追溯。

```text
用户研究请求
    │
    ▼
Point-in-Time 数据层 ──► Evidence Ledger
    │                         │
    ▼                         ▼
Research ─► Bull/Bear ─► Critic ─► Judge
                                      │
                                      ▼
                               Prediction Ledger
                                      │
                                      ▼
                              自动结算与指标计算
                                      │
                                      ▼
                              Reflection / Memory
```

## 关键边界

1. 数据层负责取数、时间过滤和指标计算，LLM 不参与收益率等确定性计算。
2. Agent 只能引用 Evidence Ledger 中已有证据。
3. Prediction 一经创建不修改原始方向与置信度，只追加结算结果。
4. Memory 只能读取已经结算的案例，避免把未经验证的观点当作经验。
5. 演示模式是确定性的，便于测试和面试演示；LLM 适配器属于下一阶段扩展点。

## 数据模型

- `Evidence`：原始事件及其发布时间、采集时间、来源和结构化负载。
- `AnalysisRun`：一次研究任务、时点、模式、结论和 Agent 调用轨迹。
- `AnalysisEvidence`：分析与证据的多对多关系，记录相关度和使用者。
- `Prediction`：预测方向、置信度、期限、基准、到期结果和复盘。

## 当前实现与扩展方向

当前版本提供可复现的本地演示数据和完整闭环，并支持可选的 OpenAI-compatible LLM。未配置 Key 或模型调用失败时回退到确定性流程。真实数据扩展应实现 Provider 接口，并确保任何检索都包含 `published_at <= as_of` 条件。后续可以接入 AkShare/Tushare、pgvector、Celery 和 OpenTelemetry。
