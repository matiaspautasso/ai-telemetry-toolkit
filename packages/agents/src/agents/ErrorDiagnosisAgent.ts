import type {
  PerformanceSnapshot,
  AgentFinding,
  AgentRecommendation,
} from '@ai-telemetry-toolkit/core';

export interface ErrorAnalysis {
  findings: AgentFinding[];
  recommendations: AgentRecommendation[];
}

export function analyze(snapshot: PerformanceSnapshot): ErrorAnalysis {
  const findings: AgentFinding[] = [];
  const recommendations: AgentRecommendation[] = [];

  const errors = snapshot.errors.filter((e) => e.level === 'error');
  const warnings = snapshot.errors.filter((e) => e.level === 'warn');

  // Group 5xx errors by route
  const fivexxByRoute = new Map<string, number>();
  for (const e of errors) {
    if (e.statusCode && e.statusCode >= 500 && e.route) {
      fivexxByRoute.set(e.route, (fivexxByRoute.get(e.route) ?? 0) + 1);
    }
  }

  for (const [route, count] of fivexxByRoute) {
    findings.push({
      type: '5xx-pattern',
      severity: count > 5 ? 'critical' : 'high',
      title: `Recurring 5xx errors on ${route}`,
      evidence: `${count} server error(s) detected`,
      affectedRoute: route,
      occurrences: count,
    });
    recommendations.push({
      priority: 1,
      action: `Investigate server errors on ${route} — check logs and exception tracking`,
      expectedImpact: 'Eliminate error rate on this endpoint',
      effort: 'medium',
      nextCommand: '/perf-errors',
    });
  }

  // Silent 4xx (client errors that may indicate broken flows)
  const fourxx = snapshot.errors.filter((e) => e.statusCode && e.statusCode >= 400 && e.statusCode < 500);
  if (fourxx.length > 10) {
    findings.push({
      type: '4xx-spike',
      severity: 'medium',
      title: `High 4xx rate (${fourxx.length} occurrences)`,
      evidence: `Possible broken client flow or missing authentication`,
    });
    recommendations.push({
      priority: 2,
      action: 'Review client-side request logic — check auth token handling and API contract',
      expectedImpact: 'Reduce unnecessary 4xx traffic',
      effort: 'low',
    });
  }

  if (warnings.length > 20) {
    findings.push({
      type: 'warning-flood',
      severity: 'low',
      title: `High warning volume (${warnings.length})`,
      evidence: 'Elevated warning rate may indicate latent issues',
    });
  }

  return { findings, recommendations };
}
