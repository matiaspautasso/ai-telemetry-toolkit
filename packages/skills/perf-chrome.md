# Skill: Chrome DevTools Performance Capture

## Goal

Capture real frontend performance metrics from a live URL using Chrome DevTools MCP — LCP, CLS, TTFB, Lighthouse scores, render-blocking resources, and network insights — then feed them into the TelemetryStore.

## Prerequisites

- Chrome DevTools MCP must be connected in Claude Code
- A URL must be accessible in the browser
- `npx ai-telemetry-toolkit mcp` must be running

## Inputs

- `url`: The page URL to audit
- `device`: `desktop` (default) or `mobile`

## Process

1. Open the target URL:
   ```
   tool: new_page({ url })
   ```

2. Start performance trace (reloads the page automatically):
   ```
   tool: performance_start_trace({ reload: true, autoStop: true })
   ```
   Extract from result:
   - LCP (ms)
   - TTFB (ms)
   - CLS score
   - Available insights (RenderBlocking, LCPBreakdown, DOMSize, ThirdParties, etc.)
   - Estimated savings per insight (ms)

3. Run Lighthouse audit:
   ```
   tool: lighthouse_audit({ device, mode: "navigation" })
   ```
   Extract:
   - Accessibility score (0–100)
   - Best Practices score (0–100)
   - SEO score (0–100)
   - Passed/failed audit count

4. Capture network requests:
   ```
   tool: list_network_requests({ resourceTypes: ["script", "stylesheet", "fetch", "xhr"] })
   ```
   Extract: slow requests (>500ms), render-blocking resources, large payloads

5. Push all metrics into TelemetryStore:
   ```
   tool: telemetry.captureFrontend({
     url,
     lcp, ttfb, cls,
     lighthouseAccessibility, lighthouseBestPractices, lighthouseSeo,
     insights: [{ name, description, estimatedSavingsMs }],
     networkRequests: [{ url, durationMs, sizeBytes, renderBlocking }]
   })
   ```

6. Call `telemetry.getFrontendMetrics` to confirm data is stored.

## Output Format

```markdown
### Chrome DevTools Capture — {url}

**Performance (lab data)**
- LCP: {lcp}ms — {good <2500ms / needs improvement / poor >4000ms}
- TTFB: {ttfb}ms
- CLS: {cls} — {good <0.1 / needs improvement / poor >0.25}

**Lighthouse Scores**
| Category | Score |
|----------|-------|
| Accessibility | {score}/100 |
| Best Practices | {score}/100 |
| SEO | {score}/100 |

**Top Insights**
{list of insights with estimated savings}

**Next command**: `/perf-plan` to get a full optimization roadmap
```

## Success Criteria

- LCP, TTFB, CLS values are captured and stored
- Lighthouse scores are captured and stored
- At least one actionable insight is surfaced
- `telemetry.getFrontendMetrics` returns non-empty array after capture
