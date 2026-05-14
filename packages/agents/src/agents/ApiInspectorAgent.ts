import type {
  PerformanceSnapshot,
  AgentFinding,
  AgentRecommendation,
} from '@ai-telemetry-toolkit/core';

const SLOW_THRESHOLD_MS = 1000;
const VERY_SLOW_THRESHOLD_MS = 3000;
const LARGE_PAYLOAD_BYTES = 500 * 1024; // 500KB

export interface ApiAnalysis {
  findings: AgentFinding[];
  recommendations: AgentRecommendation[];
}

export function analyze(snapshot: PerformanceSnapshot): ApiAnalysis {
  const findings: AgentFinding[] = [];
  const recommendations: AgentRecommendation[] = [];

  const slow = snapshot.backendMetrics.filter((m) => m.durationMs > SLOW_THRESHOLD_MS);
  const verySlow = snapshot.backendMetrics.filter((m) => m.durationMs > VERY_SLOW_THRESHOLD_MS);

  if (verySlow.length > 0) {
    verySlow.forEach((m) => {
      findings.push({
        type: 'very-slow-endpoint',
        severity: 'critical',
        title: `Critical latency on ${m.method} ${m.route}`,
        evidence: `${m.durationMs}ms response time with ${m.dbQueries} DB queries`,
        affectedRoute: m.route,
      });
    });
    recommendations.push({
      priority: 1,
      action: `Profile ${verySlow.length} endpoint(s) exceeding 3s — check DB queries and business logic`,
      expectedImpact: 'Reduce p99 latency below 500ms',
      effort: 'high',
      nextCommand: '/perf-api',
    });
  } else if (slow.length > 0) {
    findings.push({
      type: 'slow-endpoint',
      severity: 'high',
      title: `${slow.length} endpoint(s) exceeding 1s`,
      evidence: slow.map((m) => `${m.method} ${m.route}: ${m.durationMs}ms`).join(', '),
    });
    recommendations.push({
      priority: 2,
      action: `Optimize ${slow.length} slow endpoint(s)`,
      expectedImpact: 'Improve average response time by 40-60%',
      effort: 'medium',
      nextCommand: '/perf-api',
    });
  }

  // Large payloads
  const large = snapshot.backendMetrics.filter(
    (m) => m.responseSize !== undefined && m.responseSize > LARGE_PAYLOAD_BYTES,
  );
  if (large.length > 0) {
    findings.push({
      type: 'large-payload',
      severity: 'medium',
      title: `Large response payload detected`,
      evidence: large
        .map((m) => `${m.route}: ${Math.round((m.responseSize ?? 0) / 1024)}KB`)
        .join(', '),
    });
    recommendations.push({
      priority: 3,
      action: 'Add pagination, field filtering, or response compression',
      expectedImpact: 'Reduce payload size by 50-80%',
      effort: 'low',
    });
  }

  // Duplicate requests (same route called many times)
  const routeCounts = new Map<string, number>();
  snapshot.backendMetrics.forEach((m) => {
    routeCounts.set(m.route, (routeCounts.get(m.route) ?? 0) + 1);
  });
  for (const [route, count] of routeCounts) {
    if (count > 10) {
      findings.push({
        type: 'duplicate-requests',
        severity: 'low',
        title: `High call frequency on ${route}`,
        evidence: `Called ${count} times — consider caching`,
        affectedRoute: route,
        occurrences: count,
      });
    }
  }

  return { findings, recommendations };
}
