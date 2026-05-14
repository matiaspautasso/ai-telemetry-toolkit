# Skill: Detect N+1 Query Pattern

## Goal

Identify N+1 query anti-patterns in the database layer and explain the data access path causing them.

## Inputs

- DB query metrics from `telemetry.getDbHotspots`
- Normalized query strings grouped by frequency
- Associated route context (which endpoint triggers the queries)
- ORM/framework hints from span attributes

## Process

1. Call `telemetry.getDbHotspots` to get query frequency data.
2. Flag any normalized query executed more than 5 times in a single request window.
3. Group by parent route to link queries to their triggering endpoint.
4. Estimate total wasted time: `count × avg_duration_ms`.
5. Identify the likely ORM call (e.g., `.findMany` in a loop).
6. Suggest a batching strategy (join, `IN` clause, `DataLoader`, eager load).

## Output Format

```markdown
### N+1 Pattern Detected

**Query**: `SELECT * FROM costs WHERE provider_id = ?`
**Frequency**: 42 executions per request
**Triggered by**: `GET /api/products`
**Total waste**: ~840ms per request

**Recommended fix**: Replace loop with:
`SELECT * FROM costs WHERE provider_id IN (?)`
or use eager loading: `include: { costs: true }`

**Risk**: Low — pure DB optimization, no API contract change
```

## Success Criteria

- N+1 patterns with frequency >= 5 are flagged
- Each finding includes estimated time savings
- Batching approach is language/ORM-agnostic
