# EvidenceAlpha 贡献指南

感谢你愿意参与 EvidenceAlpha。代码、文档、测试、问题复现和功能建议都很有价值。

## 提交问题

提交 Issue 前请先搜索是否已有相同问题，并尽量提供：

- 问题描述与预期行为
- 最小复现步骤
- Python、Node.js、操作系统和浏览器版本
- 相关日志或截图（请删除 API Key、Token 等敏感信息）

## 开发流程

1. Fork 仓库并基于 `main` 创建功能分支。
2. 只提交与当前改动相关的文件，避免混入格式化或无关重构。
3. 新功能需要补充测试；涉及时点数据时，必须验证 `published_at <= as_of`。
4. 提交前运行后端、静态检查和前端测试。
5. 创建 Pull Request，说明改动内容、设计原因、验证方式和潜在影响。

```powershell
python -m pytest --cov=backend --cov-report=term-missing
ruff check backend benchmarks tests
cd frontend
npm test
```

## Agent 与评测约束

- Agent 不得引用 Evidence Ledger 之外的证据。
- Prediction 创建后不得改写原始方向与置信度，只能追加结算结果。
- Memory 只能检索研究时点前已结算且股票、预测周期匹配的案例。
- README 中的指标必须能够通过仓库内脚本复现，并标注数据集性质和限制。
- 不得把离线合成基准描述为真实市场回测或真实投资收益。

## 代码风格

- Python 遵循 Ruff 检查结果，优先使用清晰的小函数和类型标注。
- API 改动需同步更新 Schema、测试和 README 示例。
- 不提交 `.env`、API Key、访问令牌、个人数据或大体积临时文件。

## 行为准则

请保持尊重、具体和建设性的沟通。对技术方案可以充分讨论，但不要针对个人进行攻击或贬损。
