# EvidenceAlpha

证据驱动、可回放、可评测的 A 股多智能体研究系统。

> 项目用于 AI 工程与金融研究方法学习，不构成任何投资建议。默认数据为明确标注的演示数据，README 不展示未经真实实验验证的收益指标。

## 为什么做这个项目

传统 Trading Agent 往往在生成“买入/卖出”后结束，难以回答三个问题：当时用了哪些信息、是否泄漏未来数据、多 Agent 是否真的优于单 Agent。EvidenceAlpha 将一次研究拆成证据、观点、裁决、预测、结算和复盘六类可审计记录。

## 核心能力

- **Point-in-Time 回放**：只允许使用研究时点之前已经发布的证据。
- **Evidence Ledger**：保存公告、新闻、行情的来源、发布时间和引用关系。
- **Agent Debate**：Research、Bull、Bear、Critic、Judge 基于同一证据集协作。
- **Prediction Ledger**：结构化保存方向、置信度、期限、基准及失效条件。
- **自动结算**：计算方向准确率、Brier Score、超额收益和校准差距。
- **消融实验**：对比 Single、Debate、Debate+Memory，不预设多 Agent 一定更好。
- **可复现演示**：没有模型 Key 也能运行、测试和展示完整流程。
- **真实模型可选**：配置 OpenAI-compatible 接口后，Bull/Bear/Critic/Judge 使用受证据约束的结构化 JSON 推理；失败时自动回退到确定性流程。

## 技术栈

- Backend：Python、FastAPI、SQLAlchemy、Pydantic、SQLite
- Frontend：React、Next.js/Vinext、TypeScript
- Engineering：Pytest、Ruff、Docker Compose、GitHub Actions

## 本地启动

### 方式一：Docker

```bash
docker compose up --build
```

- Web：<http://localhost:5173>
- API 文档：<http://localhost:8000/docs>

如需连接真实模型，复制 `.env.example` 为 `.env`，设置 `LLM_API_KEY`、`LLM_BASE_URL` 和 `LLM_MODEL`。不要将 `.env` 提交到 GitHub。

### 方式二：Windows 脚本

```powershell
./scripts/setup.ps1
```

随后打开两个终端：

```powershell
./scripts/start-backend.ps1
./scripts/start-frontend.ps1
```

## API 示例

```bash
curl -X POST http://localhost:8000/api/v1/analyses \
  -H "Content-Type: application/json" \
  -d '{"symbol":"300750","query":"分析近期事件","horizon_days":5,"mode":"debate"}'
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `POST /api/v1/analyses` | 创建研究与预测卡 |
| `GET /api/v1/analyses` | 查询研究历史 |
| `GET /api/v1/evidence` | 查询证据账本 |
| `POST /api/v1/predictions/{id}/settle` | 结算预测 |
| `GET /api/v1/metrics` | 获取评测指标 |
| `GET /api/v1/dashboard` | 获取看板聚合数据 |

## 测试

```powershell
./.venv/Scripts/python.exe -m pytest
cd frontend
npm.cmd run build
```

测试覆盖核心研究创建、证据关联、预测结算、指标更新和时点过滤。

## 项目结构

```text
backend/                FastAPI、数据库和研究工作流
frontend/               React 投研看板
tests/                  后端自动测试
docs/                   架构、学习路线和面试指南
scripts/                Windows 一键启动脚本
.github/workflows/      GitHub Actions
docker-compose.yml      本地容器部署
```

## 学习入口

1. [架构说明](docs/ARCHITECTURE.md)
2. [14 天学习路线](docs/LEARNING_GUIDE.md)
3. [面试追问清单](docs/INTERVIEW_GUIDE.md)

## 开源说明

本项目的产品思路受到 TradingAgents、FinAgent 等公开金融 Agent 项目启发，代码与数据模型围绕“证据链、时点回放、预测账本和量化评测”重新实现。采用 MIT License。
