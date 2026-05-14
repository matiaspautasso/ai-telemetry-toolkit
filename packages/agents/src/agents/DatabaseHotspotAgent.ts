import type {
  PerformanceSnapshot,
  AgentFinding,
  AgentRecommendation,
} from '@ai-telemetry-toolkit/core';

const N_PLUS_ONE_THRESHOLD = 5;
const SLOW_QUERY_THRESHOLD_MS = 200;

export interface DatabaseAnalysis {
  findings: AgentFinding[];
  recommendations: AgentRecommendation[];
}

export function analyze(snapshot: PerformanceSnapshot): DatabaseAnalysis {
  const findings: AgentFinding[] = [];
  const recommendations: AgentRecommendation[] = [];

  // Group queries by normalized form
  const grouped = new Map<string, { count: number; totalMs: number }>();
  for (const m of snapshot.dbMetrics) {
    const existing = grouped.get(m.normalized);
    if (existing) {
      existing.count++;
      existing.totalMs += m.durationMs;
    } else {
      grouped.set(m.normalized, { count: 1, totalMs: m.durationMs });
    }
  }

  // N+1 detection
  for (const [query, stats] of grouped) {
    if (stats.count >= N_PLUS_ONE_THRESHOLD) {
      findings.push({
        type: 'n-plus-one',
        severity: stats.count > 20 ? 'critical' : stats.count > 10 ? 'high' : 'medium',
        title: `Possible N+1 query pattern`,
        evidence: `Query executed ${stats.count}x: "${query.slice(0, 80)}..."`,
        occurrences: stats.count,
      });
      recommendations.push({
        priority: 1,
        action: `Batch or cache the repeated query: "${query.slice(0, 60)}..."`,
        expectedImpact: `Reduce ${stats.count} DB round-trips to 1 — saves ~${Math.round(stats.totalMs)}ms`,
        effort: 'medium',
        nextCommand: '/perf-db',
      });
    }
  }

  // Slow individual queries
  const slowQueries = snapshot.dbMetrics.filter((m) => m.durationMs > SLOW_QUERY_THRESHOLD_MS);
  if (slowQueries.length > 0) {
    const slowest = slowQueries.sort((a, b) => b.durationMs - a.durationMs)[0];
    if (slowest) {
      findings.push({
        type: 'slow-query',
        severity: slowest.durationMs > 1000 ? 'high' : 'medium',
        title: `Slow ${slowest.operation} query detected`,
        evidence: `"${slowest.normalized.slice(0, 80)}" took ${slowest.durationMs}ms`,
        affectedQuery: slowest.normalized,
      });
      recommendations.push({
        priority: findings.length,
        action: `Add index or optimize query on table "${slowest.table ?? 'unknown'}"`,
        expectedImpact: `Could reduce query time from ${slowest.durationMs}ms to <50ms`,
        effort: 'medium',
        nextCommand: '/perf-db',
      });
    }
  }

  return { findings, recommendations };
}
