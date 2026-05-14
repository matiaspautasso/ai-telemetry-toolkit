# Skill: Analyze API Latency

## Goal

Detect slow API endpoints and explain the likely cause of latency — whether it's DB-bound, CPU-bound, network, or payload-related.

## Inputs

- HTTP request traces from `telemetry.getBackendMetrics`
- Duration by route (ms)
- HTTP status codes
- DB spans per request from `telemetry.getDbHotspots`
- Payload size (request/response bytes)
- Error logs from `telemetry.getRecentErrors`

## Process

1. Call `telemetry.getSlowEndpoints` with threshold 500ms.
2. For each slow endpoint, call `telemetry.getDbHotspots` to correlate DB time.
3. Compare backend processing time vs. total response time.
4. Identify bottleneck category:
   - DB-bound: dbQueries > 10 or slowest span is a DB query
   - CPU-bound: high durationMs with low dbQueries
   - Network: large responseSize with fast server processing
   - Frontend wait: backend is fast but LCP/FID is poor
5. Return findings sorted by severity.

## Output Format

```markdown
### API Latency Analysis

**Slowest endpoint**: `GET /api/products` — 2480ms
**Bottleneck**: Database (42 queries, slowest: `catalog_provider.findMany` 1.8s)
**Recommended fix**: Batch provider cost lookup into one aggregate query
**Risk**: Medium — requires schema awareness
**Next command**: `/perf-db`
```

## Success Criteria

- All endpoints above 500ms are identified
- Root cause is categorized (DB / CPU / network / frontend)
- At least one actionable recommendation is produced
- Output is under 20 lines
