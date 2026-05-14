# Skill: Generate Performance Report

## Goal

Produce a comprehensive, shareable performance report in Markdown, HTML, or PR summary format.

## Inputs

- Full snapshot from `telemetry.getSnapshot`
- Agent findings from `telemetry.generateOptimizationPlan`
- Desired output format: `markdown | html | pr-summary | console`

## Process

1. Call `telemetry.getSnapshot` to get current state.
2. Call `telemetry.generateOptimizationPlan` to get prioritized recommendations.
3. Merge snapshot + plan into a `PerformanceSnapshot` with findings.
4. Pass to the appropriate reporter:
   - `markdown`: full report with tables and severity indicators
   - `html`: styled dark-theme report page
   - `pr-summary`: compact table for GitHub PR body
   - `console`: colored terminal output
5. If output path is provided, write the file. Otherwise return inline.

## Output Format

Depends on format requested. Markdown example:

```markdown
# Performance Report — 2026-05-13

## Top Slow Endpoints
| # | Route | Duration | DB Queries |
|---|-------|----------|------------|
| 1 | GET /api/products | 2480ms | 42 |
| 2 | GET /api/clients  | 1830ms | 8  |

## Main Finding
Possible N+1 query pattern in `productos.service.ts`

## Recommended Action
Batch provider cost lookup into one aggregate query.
```

## Success Criteria

- Report is generated without errors
- All sections (endpoints, DB, errors, recommendations) are present
- Format matches the requested output type
- File is written if output path is specified
