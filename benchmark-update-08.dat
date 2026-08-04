# 简历项目表述

## 推荐版本

**EvidenceAlpha：证据驱动的多智能体投研评测系统**  
GitHub：https://github.com/weiasd51/EvidenceAlpha

**技术栈：** Python、FastAPI、SQLAlchemy、Pydantic、SQLite、React、TypeScript、Pytest、Ruff、Docker、GitHub Actions

**项目描述：** 面向 A 股事件研究场景，构建“时点证据采集 → Bull/Bear 多 Agent 辩论 → Critic 审计 → Judge 裁决 → 预测结算 → 复盘评测”的端到端系统，重点解决投研结论缺少证据链、未来数据泄漏以及多 Agent 效果不可量化的问题。

- 设计 Research、Bull、Bear、Critic、Judge、Memory 多角色工作流，支持 Single、Debate、Debate+Memory 三种消融模式；将结论、置信度、预测周期、基准、失效条件和 Agent Trace 结构化落库，并通过 FastAPI 提供研究、证据、结算和指标查询接口。
- 实现 Point-in-Time Evidence Ledger，按 `published_at <= as_of` 过滤公告、新闻、行情和风险证据；在 144 次可复现离线合成基准中检查 576 条证据引用，未来数据违规为 0，预测结算率与审计完整率均为 100%。
- 建立方向准确率、Brier Score、Calibration Gap 和超额收益评测链路；基准总体方向准确率 66.67%、Brier Score 0.2197，Debate+Memory 的 Brier Score 为 0.2015，较 Debate 的 0.2295 改善 12.20%。
- 通过消融实验定位并修复 SQLite 时区比较、Memory 读取未来结算记录、跨股票/跨周期错误召回等问题；使用 Pytest、Ruff 与 GitHub Actions 建立前后端 CI，7 项后端测试全部通过，后端语句覆盖率达到 85%。

## 一页简历精简版

**EvidenceAlpha｜证据驱动多智能体投研评测系统**

- 基于 FastAPI、SQLAlchemy、React 构建可审计投研系统，实现 Research/Bull/Bear/Critic/Judge/Memory 多 Agent 协作及 Single、Debate、Debate+Memory 消融实验。
- 设计 Point-in-Time Evidence Ledger 与 Prediction Ledger，结构化记录证据来源、发布时间、Agent Trace、预测置信度、基准和失效条件；144 次离线合成基准中完成 576 条证据检查，未来数据违规 0 次。
- 建立方向准确率、Brier Score 与 Calibration Gap 评测链路：总体准确率 66.67%、Brier 0.2197，Memory 模式 Brier 0.2015，较 Debate 改善 12.20%。
- 使用 Pytest、Ruff、Docker、GitHub Actions 完成自动化验证，7 项后端测试全部通过，后端语句覆盖率 85%。

## 面试时必须主动说明

上述 144 次实验来自确定性离线合成基准，用于验证工程链路、时点约束和置信度校准，
不是实盘回测结果。若面试官询问真实市场表现，应回答：当前版本尚未接入真实行情复权、交易日历、
手续费和滚动回测，下一阶段会接入真实 Point-in-Time 数据后再报告真实收益指标。
