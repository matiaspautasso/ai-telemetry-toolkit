import type {
  BackendMetric,
  DbQueryMetric,
  FrontendMetric,
  LogEvent,
  PerformanceSnapshot,
  AgentFinding,
  AgentRecommendation,
} from '@ai-telemetry-toolkit/core';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 1000;

class TelemetryStore {
  private backendMetrics: BackendMetric[] = [];
  private dbMetrics: DbQueryMetric[] = [];
  private frontendMetrics: FrontendMetric[] = [];
  private errors: LogEvent[] = [];
  private storePath: string | null = null;

  configure(opts: { storePath?: string }): void {
    if (opts.storePath) {
      this.storePath = opts.storePath;
    }
  }

  addBackendMetric(metric: BackendMetric): void {
    this.backendMetrics.push(metric);
    if (this.backendMetrics.length > MAX_ENTRIES) {
      this.backendMetrics.shift();
    }
    this.flush();
  }

  addDbMetric(metric: DbQueryMetric): void {
    this.dbMetrics.push(metric);
    if (this.dbMetrics.length > MAX_ENTRIES) {
      this.dbMetrics.shift();
    }
    this.flush();
  }

  addFrontendMetric(metric: FrontendMetric): void {
    this.frontendMetrics.push(metric);
    if (this.frontendMetrics.length > MAX_ENTRIES) {
      this.frontendMetrics.shift();
    }
    this.flush();
  }

  addError(event: LogEvent): void {
    this.errors.push(event);
    if (this.errors.length > MAX_ENTRIES) {
      this.errors.shift();
    }
    this.flush();
  }

  getSnapshot(windowMs = DEFAULT_WINDOW_MS): PerformanceSnapshot {
    const since = Date.now() - windowMs;
    return {
      capturedAt: Date.now(),
      windowMs,
      backendMetrics: this.backendMetrics.filter((m) => m.timestamp >= since),
      dbMetrics: this.dbMetrics.filter((m) => m.timestamp >= since),
      frontendMetrics: this.frontendMetrics.filter((m) => m.timestamp >= since),
      errors: this.errors.filter((e) => e.timestamp >= since),
      findings: [],
      recommendations: [],
    };
  }

  getSlowEndpoints(thresholdMs = 500, limit = 10): BackendMetric[] {
    return [...this.backendMetrics]
      .filter((m) => m.durationMs >= thresholdMs)
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, limit);
  }

  getRecentErrors(limit = 20): LogEvent[] {
    return [...this.errors]
      .filter((e) => e.level === 'error')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getDbHotspots(limit = 10): DbQueryMetric[] {
    const grouped = new Map<string, { total: number; count: number; metric: DbQueryMetric }>();
    for (const m of this.dbMetrics) {
      const existing = grouped.get(m.normalized);
      if (existing) {
        existing.total += m.durationMs;
        existing.count += 1;
      } else {
        grouped.set(m.normalized, { total: m.durationMs, count: 1, metric: m });
      }
    }
    return [...grouped.values()]
      .sort((a, b) => b.count - a.count || b.total - a.total)
      .slice(0, limit)
      .map((g) => ({ ...g.metric, durationMs: g.total / g.count }));
  }

  withFindings(
    findings: AgentFinding[],
    recommendations: AgentRecommendation[],
  ): PerformanceSnapshot {
    const snapshot = this.getSnapshot();
    return { ...snapshot, findings, recommendations };
  }

  clear(): void {
    this.backendMetrics = [];
    this.dbMetrics = [];
    this.frontendMetrics = [];
    this.errors = [];
  }

  private flush(): void {
    if (!this.storePath) return;
    try {
      mkdirSync(this.storePath.replace(/[/\\][^/\\]+$/, ''), { recursive: true });
      writeFileSync(
        this.storePath,
        JSON.stringify(
          {
            flushedAt: Date.now(),
            backendMetrics: this.backendMetrics.slice(-100),
            dbMetrics: this.dbMetrics.slice(-100),
            frontendMetrics: this.frontendMetrics.slice(-100),
            errors: this.errors.slice(-50),
          },
          null,
          2,
        ),
      );
    } catch {
      // non-critical flush failure — store stays in memory
    }
  }
}

export const telemetryStore = new TelemetryStore();
