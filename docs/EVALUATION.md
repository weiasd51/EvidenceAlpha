# EvidenceAlpha 评测说明

## 1. 评测目的

该评测用于验证 EvidenceAlpha 的研究、预测、结算、校准、审计和时点回放链路，
不用于证明真实市场收益，也不能作为投资业绩使用。

## 2. 数据口径

- 数据集：`synthetic-point-in-time-v1` 确定性合成基准。
- 股票：300750、600519、000858、601318。
- 历史研究时点：2024 年 1、4、7、10 月各一个快照。
- 预测周期：T+1、T+5、T+20。
- 实验模式：Single、Debate、Debate+Memory。
- 样本规模：每种模式 48 个案例，共 144 次研究与结算。
- 结果分布：每三个案例包含两个正超额收益和一个负超额收益。

每种模式使用独立的内存 SQLite 数据库，避免实验之间共享预测记录。
LLM Key 在 benchmark 中被强制关闭，保证任何机器均能得到相同结果。

## 3. 指标定义

- 方向准确率：预测方向与相对沪深 300 的超额收益方向一致的比例。
- Brier Score：`(confidence - outcome)^2` 的均值，越低越好。
- Calibration Gap：已结算预测的平均置信度与方向准确率之差的绝对值。
- 时点违规：证据发布时间晚于研究 `as_of` 的引用次数。
- 审计完整率：同时具备 4 条证据、Agent Trace、预测结算、Brier Score 和失效条件的运行比例。

## 4. 最终结果

| 模式 | 样本数 | 方向准确率 | Brier Score | Calibration Gap | 时点违规 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Single | 48 | 66.67% | 0.2280 | 0.0762 | 0 |
| Debate | 48 | 66.67% | 0.2295 | 0.0855 | 0 |
| Debate+Memory | 48 | 66.67% | 0.2015 | 0.0625 | 0 |

汇总结果：

- 总运行数：144。
- 总体方向准确率：66.67%。
- 总体 Brier Score：0.2197。
- Debate+Memory 相比 Debate 的 Brier Score 改善：12.20%。
- 证据时点检查：576 次，未来证据违规 0 次。
- 预测结算率：100%。
- 审计完整率：100%。
- 后端自动化测试：7 项通过，语句覆盖率 85%。

## 5. Benchmark 发现并修复的问题

1. SQLite 返回无时区 datetime，重复证据时会与有时区 `as_of` 比较失败；统一归一化为 UTC。
2. Memory Agent 原先会读取研究时点之后才结算的预测；增加 `settled_at <= as_of` 约束。
3. Memory Agent 原先混用不同股票和不同预测周期的案例；改为按 `symbol + horizon_days` 检索同类历史。

## 6. 复现命令

```powershell
python -m benchmarks.run_benchmark --write
python -m pytest --cov=backend --cov-report=term-missing
ruff check backend benchmarks tests
```

机器可读结果位于 `benchmarks/results/latest.json`，表格报告位于
`benchmarks/results/latest.md`。
