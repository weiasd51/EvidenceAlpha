# EvidenceAlpha Benchmark Report

> This report uses a deterministic synthetic fixture. It validates the evaluation
> pipeline and must not be presented as real-market investment performance.

## Dataset and protocol

- Benchmark: `synthetic-point-in-time-v1`
- Cases per mode: 48
- Total analysis/settlement runs: 144
- Matrix: 4 symbols × 4 point-in-time snapshots × 3 horizons × 3 modes

## Results

| Mode | Runs | Accuracy | Brier Score | Calibration Gap | PIT violations |
| --- | ---: | ---: | ---: | ---: | ---: |
| single | 48 | 66.67% | 0.2280 | 0.0762 | 0 |
| debate | 48 | 66.67% | 0.2295 | 0.0855 | 0 |
| debate_memory | 48 | 66.67% | 0.2015 | 0.0625 | 0 |

- Overall direction accuracy: **66.67%**
- Overall Brier Score: **0.2197**
- Settled predictions: **100.00%**
- Auditable complete runs: **100.00%**
- Point-in-time evidence checks: **576**
- Future-evidence violations: **0**
- Debate+Memory Brier improvement vs Debate: **12.20%**

## Reproduce

```bash
python -m benchmarks.run_benchmark --write
```
