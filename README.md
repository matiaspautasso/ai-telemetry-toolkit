# AI Telemetry Toolkit

> Stop guessing where your app is slow. Connect OpenTelemetry, Chrome DevTools, and AI agents — get precise answers directly in Claude Code.

[![npm](https://img.shields.io/npm/v/ai-telemetry-toolkit)](https://www.npmjs.com/package/ai-telemetry-toolkit)
[![GitHub](https://img.shields.io/badge/GitHub-matiaspautasso-black?logo=github)](https://github.com/matiaspautasso/ai-telemetry-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](tsconfig.base.json)

---

## What Is This?

**AI Telemetry Toolkit** is a development-time observability layer that connects your app to AI agents through MCP (Model Context Protocol).

It instruments your backend with OpenTelemetry, captures frontend metrics via Chrome DevTools MCP, and exposes everything as tools that Claude Code can query and reason about — giving you diagnostic answers in natural language instead of dashboards.

---

## What Problem Does It Solve?

When something is slow, a developer faces five scattered data sources:

```
DevTools Network tab   →  "The request took 2.8s"
Database logs          →  "42 queries ran"
React Profiler         →  "ProductTable re-rendered 450 times"
Error monitoring       →  "3 500s in the last 5 minutes"
APM dashboard          →  (requires VPN + 3 clicks)
```

None of these talk to each other. You context-switch between tools, manually correlate the data, and still have to guess the root cause.

**This toolkit solves that with one command:**

```
/perf-snapshot
```

And Claude Code answers:

```
GET /api/products takes 2.8s.
→ 70% of the time is in the cost query (42 repetitions — N+1 pattern).
→ Frontend renders 450 rows without pagination (+1.2s paint time).

Priority:
  1. Batch the cost lookup into one query  → saves ~1.9s
  2. Virtualize ProductTable              → saves ~1.2s paint
  3. Investigate 3 recent 500 errors on /api/checkout
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.5 (strict) |
| Runtime | Node.js ≥ 18 |
| Monorepo | pnpm workspaces |
| Backend tracing | OpenTelemetry SDK (`@opentelemetry/sdk-node`, auto-instrumentation) |
| Frontend capture | Chrome DevTools MCP (Lighthouse + Performance Trace) |
| AI protocol | MCP — Model Context Protocol (`@modelcontextprotocol/sdk`) |
| CLI | Commander + Inquirer |
| Testing | Vitest |
| Output formats | Markdown, HTML, JSON, Console, PR Summary |

---

## Main Modules

```
packages/
├── core/           Shared TypeScript interfaces — zero dependencies
│                   TraceEvent, BackendMetric, FrontendMetric, DbQueryMetric,
│                   PerformanceSnapshot, AgentFinding, AgentRecommendation
│
├── otel/           OpenTelemetry integration
│                   Auto-instruments HTTP + DB spans. Custom SpanExporter
│                   writes to TelemetryStore (in-memory + JSON flush)
│
├── mcp-server/     MCP server over stdio — 9 tools
│                   Claude Code / Codex calls these to query telemetry
│
├── agents/         6 pure-function analysis agents
│                   PerformanceAgent, ApiInspectorAgent, DatabaseHotspotAgent,
│                   FrontendRenderAgent, ErrorDiagnosisAgent, OptimizationPlannerAgent
│
├── chrome-bridge/  Chrome DevTools MCP integration
│                   Maps Lighthouse + Performance Trace → FrontendMetric[]
│                   Feeds real browser data into TelemetryStore
│
├── skills/         7 Claude Code skill files (.md)
│                   Slash commands with step-by-step AI instructions
│
├── reporters/      Output formatters
│                   Markdown, HTML, JSON, Console (colored), PR Summary
│
└── commands/       CLI entry point
                    npx ai-telemetry-toolkit init | mcp | snapshot | report
```

**Dependency graph (no circular deps):**
```
core ← otel ← mcp-server
          ↑
       agents    chrome-bridge
          ↓
       reporters ← commands (CLI)
```

---

## How to Install

```bash
# No install needed — run directly
npx ai-telemetry-toolkit init
```

Or add to your project:

```bash
npm install ai-telemetry-toolkit
# or
pnpm add ai-telemetry-toolkit
```

---

## How to Run

### 1. Run the interactive installer

```bash
npx ai-telemetry-toolkit init
```

The wizard detects your framework, generates config, and creates slash commands:

```
🚀 AI Telemetry Toolkit — Interactive Setup

✔ Service name: my-api
✔ Framework: express
✔ Store path: .telemetry-agent/store.json
✔ Generate MCP config for Claude Code? Yes

  ✔ Created .telemetry-agent/config.json
  ✔ Created .telemetry-agent/mcp.json
  ✔ Created 7 slash commands in .telemetry-agent/skills/
  ✔ Created .telemetry-agent/instrument.js
```

### 2. Instrument your app (one line)

```js
// At the VERY TOP of your entry file — before any other imports
import './.telemetry-agent/instrument.js';
```

### 3. Start the MCP server

```bash
npx ai-telemetry-toolkit mcp
```

### 4. Add MCP to Claude Code

Copy `.telemetry-agent/mcp.json` to your Claude Code MCP config, or add manually:

```json
{
  "mcpServers": {
    "ai-telemetry-toolkit": {
      "command": "npx",
      "args": ["ai-telemetry-toolkit", "mcp"]
    }
  }
}
```

### 5. Ask Claude Code

```
/perf-snapshot          → Full system analysis
/perf-api               → Slow endpoints deep-dive
/perf-db                → N+1 detection + query hotspots
/perf-chrome <url>      → Real browser metrics via Chrome DevTools MCP
/perf-plan              → Prioritized optimization roadmap
```

---

## MCP Tools (9 total)

| Tool | Description |
|------|-------------|
| `telemetry.getSnapshot` | Full performance snapshot |
| `telemetry.getSlowEndpoints` | Endpoints above latency threshold |
| `telemetry.getRecentErrors` | Recent 5xx / 4xx events |
| `telemetry.getBackendMetrics` | All HTTP backend metrics |
| `telemetry.getFrontendMetrics` | LCP, CLS, TTFB, Lighthouse scores |
| `telemetry.getDbHotspots` | Query frequency + N+1 detection |
| `telemetry.captureFrontend` | **NEW** — Push Chrome DevTools data into store |
| `telemetry.explainPerformance` | Plain-language root cause analysis |
| `telemetry.generateOptimizationPlan` | Prioritized action plan |

---

## Live Demo — Real Data

> Captured from [github.com/matiaspautasso/ai-telemetry-toolkit](https://github.com/matiaspautasso/ai-telemetry-toolkit) using Chrome DevTools MCP + Performance Trace.

### `/perf-chrome https://github.com/matiaspautasso/ai-telemetry-toolkit`

```
Chrome DevTools Capture — github.com/matiaspautasso/ai-telemetry-toolkit

Performance (lab data)
  LCP:   405ms  ✅ Excellent (threshold: <2500ms)
  TTFB:   50ms  ✅ Excellent
  CLS:    0.00  ✅ No layout shifts

Lighthouse Scores
  Accessibility:   100/100  ✅
  Best Practices:  100/100  ✅
  SEO:             100/100  ✅

Insights detected:
  · RenderBlocking   — render-blocking requests in critical path
  · DOMSize          — large DOM may slow style recalc
  · ThirdParties     — 3rd party scripts impact load time
  · ForcedReflow     — JS queries geometry after DOM mutation
  · Cache            — some resources lack long-term caching

Next: /perf-plan → get optimization roadmap
```

### `/perf-db` — Example output with N+1 detected

```
Database Hotspots

  🔴 N+1 Pattern — CRITICAL
     Query: SELECT * FROM costs WHERE provider_id = ?
     Frequency: 42x per request
     Total waste: ~840ms
     Fix: batch into SELECT * FROM costs WHERE provider_id IN (?)

  🟠 Slow Query — HIGH
     SELECT * FROM products JOIN providers... → 1.2s
     Table: products | Operation: SELECT
     Fix: add composite index on (provider_id, status)

Recommended: /perf-plan to see full optimization roadmap
```

---

## Development

```bash
git clone https://github.com/matiaspautasso/ai-telemetry-toolkit
cd ai-telemetry-toolkit
pnpm install
pnpm test        # run all tests
pnpm build       # build all packages
pnpm typecheck   # type check all packages
```

---

## Why Not Just Use DataDog / New Relic?

Those are **production monitoring** tools. This is a **development-time AI assistant**:

| | DataDog / New Relic | AI Telemetry Toolkit |
|-|---------------------|---------------------|
| Setup | Hours + cloud account | 60 seconds via `npx` |
| Interface | Dashboard | Natural language in your editor |
| Scope | Production | Development (local) |
| Cost | $$$ | Free / open source |
| AI integration | None | Native (MCP) |

---

## License

MIT © [matiaspautasso](https://github.com/matiaspautasso)

---

*Built for developers who want to stop guessing and start knowing.*
