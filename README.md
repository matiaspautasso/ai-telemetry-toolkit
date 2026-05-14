# AI Telemetry Toolkit

> Connect your project to AI agents, MCP Chrome DevTools, and OpenTelemetry — get precise performance answers during development.

[![npm](https://img.shields.io/npm/v/ai-telemetry-toolkit)](https://www.npmjs.com/package/ai-telemetry-toolkit)
[![GitHub](https://img.shields.io/badge/GitHub-matiaspautasso-black?logo=github)](https://github.com/matiaspautasso/ai-telemetry-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](tsconfig.base.json)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange)](pnpm-workspace.yaml)

---

## The Problem

You open DevTools, see a slow request, and think: _"Is this the DB? The backend logic? A bad React render? A huge payload?"_

You have data spread across five different places and no single view to reason about it.

**AI Telemetry Toolkit fixes this.**

It connects OpenTelemetry, Chrome DevTools MCP, and AI agents into a single observable layer — then lets Claude Code answer:

```
GET /api/products takes 2.8s.
70% of the time is in the cost query (42 repetitions — N+1 pattern).
The frontend also renders 450 rows without pagination.

Priority:
  1. Batch the cost lookup into one aggregate query → -1.9s
  2. Add pagination to ProductTable → reduce DOM by 95%
```

---

## Quick Start

```bash
# Install and run the interactive setup wizard
npx ai-telemetry-toolkit init
```

The wizard will:
- Detect your framework (Express, Fastify, NestJS, Hono)
- Generate `.telemetry-agent/config.json` and `mcp.json`
- Create 7 slash commands for Claude Code
- Write an instrumentation bootstrap file

```bash
# Add to the TOP of your app entry point
import './.telemetry-agent/instrument.js';

# Start the MCP server
npx ai-telemetry-toolkit mcp

# In Claude Code, ask:
/perf-snapshot
```

---

## Demo Output

```
╔══════════════════════════════════════╗
║    AI Telemetry Toolkit — Snapshot   ║
╚══════════════════════════════════════╝

Slow Endpoints:
  1. 2480ms  GET /api/products  (42 queries)
  2. 1830ms  GET /api/clients   (8 queries)
  3.  920ms  POST /api/orders   (3 queries)

Recent Errors (2):
  ✖ 500 /api/checkout — Internal Server Error
  ✖ 503 /api/inventory — Service Unavailable

Recommendations:
  1. Batch product cost queries (N+1 — 42x the same SELECT)
     → Reduce /api/products from 2.48s to ~180ms
  2. Add pagination to /api/clients response (1.8MB payload)
     → Reduce payload by 95%
```

---

## Slash Commands

| Command | What it does |
|---------|-------------|
| `/perf-snapshot` | Full system analysis — the starting point |
| `/perf-api` | Slow endpoints, large payloads, duplicate calls |
| `/perf-db` | N+1 detection, slow queries, missing indexes |
| `/perf-front` | React render counts, LCP, FID, CLS |
| `/perf-errors` | 5xx patterns, 4xx spikes, silent failures |
| `/perf-plan` | Prioritized optimization roadmap |
| `/perf-compare` | Before/after diff after a code change |

---

## MCP Tools

The MCP server exposes 8 tools consumable by Claude Code, Codex, or any MCP-compatible client:

| Tool | Description |
|------|-------------|
| `telemetry.getSnapshot` | Full performance snapshot |
| `telemetry.getSlowEndpoints` | Endpoints above a latency threshold |
| `telemetry.getRecentErrors` | Recent error-level events |
| `telemetry.getFrontendMetrics` | LCP, FID, CLS, render counts |
| `telemetry.getBackendMetrics` | All HTTP backend metrics |
| `telemetry.getDbHotspots` | Grouped DB queries sorted by frequency |
| `telemetry.explainPerformance` | Plain-language root cause analysis |
| `telemetry.generateOptimizationPlan` | Prioritized action plan |

---

## CLI Commands

```bash
npx ai-telemetry-toolkit init        # AI-assisted interactive setup
npx ai-telemetry-toolkit mcp         # Start MCP server (stdio)
npx ai-telemetry-toolkit snapshot    # Print current snapshot to console
npx ai-telemetry-toolkit report      # Generate full report (markdown/html/json)
```

---

## Package Architecture

```
ai-telemetry-toolkit/            ← pnpm monorepo
├── packages/
│   ├── core/                   ← Shared TypeScript models (zero deps)
│   ├── otel/                   ← OpenTelemetry SDK integration + TelemetryStore
│   ├── mcp-server/             ← MCP server with 8 telemetry tools
│   ├── agents/                 ← 6 specialized AI analysis agents
│   ├── skills/                 ← Claude Code skill files (.md)
│   ├── reporters/              ← Output formatters (MD, HTML, JSON, console)
│   └── commands/               ← CLI entry point + interactive installer
```

### Dependency Graph

```
core ← otel ← mcp-server
          ↑
       agents → reporters → commands (CLI)
```

`core` has zero internal dependencies. Everything flows one way — no circular deps.

---

## AI Agents

| Agent | Detects |
|-------|---------|
| `PerformanceAgent` | Overall health score (0–100) |
| `ApiInspectorAgent` | Slow endpoints, large payloads, duplicate calls |
| `DatabaseHotspotAgent` | N+1 patterns, slow queries |
| `FrontendRenderAgent` | Poor LCP/FID, excessive renders |
| `ErrorDiagnosisAgent` | 5xx patterns, 4xx spikes |
| `OptimizationPlannerAgent` | Aggregates all findings, generates priority plan |

---

## Claude Code Skills

Six skill files are included and auto-installed by `init`:

- `analyze-api-latency` — Rank endpoints, identify bottleneck type
- `detect-n-plus-one` — Find repeated queries, suggest batching
- `inspect-react-render` — Component render analysis
- `summarize-telemetry` — Standup/PR-ready summary
- `compare-before-after` — Quantify optimization impact
- `generate-performance-report` — Full report in any format

---

## What Gets Captured

```typescript
// HTTP layer (via OTel auto-instrumentation)
{ route, method, durationMs, status, dbQueries, slowestSpan }

// Database layer (SQL spans)
{ query, durationMs, operation, table, normalized }

// Frontend layer (Web Vitals + render metrics)
{ type: 'lcp' | 'fid' | 'cls', valueMs, component, renderCount }
```

No code changes required in your app beyond one `import` at startup.

---

## Development

```bash
# Clone and install
git clone https://github.com/your-org/ai-telemetry-toolkit
cd ai-telemetry-toolkit
pnpm install

# Run tests
pnpm test

# Build all packages
pnpm build

# Type check
pnpm typecheck
```

---

## Why Not Just Use DataDog / New Relic?

Those are production monitoring tools. This is a **development-time** tool designed to:

- Work locally with zero cloud setup
- Feed directly into your AI coding assistant
- Give you answers in natural language, not dashboards
- Install in 60 seconds via `npx`

---

## License

MIT © [matiaspautasso](https://github.com/matiaspautasso)

---

_Built for developers who want to stop guessing and start knowing._
