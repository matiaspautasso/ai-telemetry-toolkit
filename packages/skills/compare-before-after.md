# Skill: Compare Before/After Performance

## Goal

Compare two telemetry snapshots (before and after a code change) to quantify improvement or regression.

## Inputs

- Snapshot A (before): `PerformanceSnapshot` from baseline
- Snapshot B (after): `PerformanceSnapshot` from current state
- Optional: specific route or query to focus on

## Process

1. Load both snapshots (from file or MCP tool calls).
2. For each route in Snapshot B, find the matching route in Snapshot A.
3. Compute delta: `(after.durationMs - before.durationMs) / before.durationMs * 100`.
4. Flag regressions (delta > +10%) and improvements (delta < -10%).
5. Compare error counts and DB query counts.
6. Produce a diff table and a verdict (improved / regressed / neutral).

## Output Format

```markdown
### Before vs After — /api/products

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Duration | 2480ms | 310ms | ✅ -87% |
| DB Queries | 42 | 1 | ✅ -98% |
| Errors | 0 | 0 | ➡️ same |
| Payload | 1.8MB | 45KB | ✅ -97% |

**Verdict**: Significant improvement — optimization successful.
```

## Success Criteria

- All shared routes are compared
- Regressions are clearly flagged
- Delta percentages are accurate
- Verdict is unambiguous (improved / regressed / neutral)
