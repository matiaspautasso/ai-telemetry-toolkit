# Skill: Summarize Telemetry

## Goal

Produce a concise, human-readable performance summary suitable for a standup, PR description, or Slack message.

## Inputs

- Full performance snapshot from `telemetry.getSnapshot`
- Findings from any agent (optional — enriches the summary)

## Process

1. Call `telemetry.getSnapshot`.
2. Extract the top 3 slow endpoints, top DB hotspot, error count.
3. Run `telemetry.explainPerformance` for root cause context.
4. Synthesize into a 5–10 line summary: headline metric, top issue, recommendation.
5. Add a performance score (0–100) derived from severity of findings.

## Output Format

```markdown
### Performance Summary — 2026-05-13 15:32

**Score**: 62/100 — needs attention

**Top issues**:
- `GET /api/products`: 2.48s — 42 DB queries (N+1 suspected)
- `GET /api/clients`: 1.83s — payload 1.8MB (no pagination)
- 3 server errors on `/api/checkout` in the last 5 minutes

**Priority action**: Batch provider cost queries (est. -1.8s on /api/products)

**Next**: Run `/perf-plan` for a full optimization roadmap
```

## Success Criteria

- Summary is ≤ 10 lines
- Score is included
- At least one concrete next step is given
