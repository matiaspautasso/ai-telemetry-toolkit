import type {
  PerformanceSnapshot,
  AgentFinding,
  AgentRecommendation,
} from '@ai-telemetry-toolkit/core';

const HIGH_RENDER_COUNT = 20;
const POOR_LCP_MS = 2500;
const POOR_FID_MS = 100;

export interface FrontendAnalysis {
  findings: AgentFinding[];
  recommendations: AgentRecommendation[];
}

export function analyze(snapshot: PerformanceSnapshot): FrontendAnalysis {
  const findings: AgentFinding[] = [];
  const recommendations: AgentRecommendation[] = [];

  const lcp = snapshot.frontendMetrics.find((m) => m.type === 'lcp');
  const fid = snapshot.frontendMetrics.find((m) => m.type === 'fid');
  const highRenders = snapshot.frontendMetrics.filter(
    (m) => m.type === 'render' && (m.renderCount ?? 0) > HIGH_RENDER_COUNT,
  );

  if (lcp && (lcp.valueMs ?? 0) > POOR_LCP_MS) {
    findings.push({
      type: 'poor-lcp',
      severity: (lcp.valueMs ?? 0) > 4000 ? 'critical' : 'high',
      title: `Poor Largest Contentful Paint`,
      evidence: `LCP: ${lcp.valueMs}ms (threshold: ${POOR_LCP_MS}ms)`,
    });
    recommendations.push({
      priority: 1,
      action: 'Optimize LCP element: lazy-load images, preload critical resources, reduce TTFB',
      expectedImpact: 'Improve LCP to <2.5s — Core Web Vital threshold',
      effort: 'medium',
      nextCommand: '/perf-front',
    });
  }

  if (fid && (fid.valueMs ?? 0) > POOR_FID_MS) {
    findings.push({
      type: 'poor-fid',
      severity: 'high',
      title: `Poor First Input Delay`,
      evidence: `FID: ${fid.valueMs}ms (threshold: ${POOR_FID_MS}ms)`,
    });
    recommendations.push({
      priority: 2,
      action: 'Break up long tasks, defer non-critical JS, use web workers for heavy computation',
      expectedImpact: 'Reduce FID to <100ms',
      effort: 'high',
    });
  }

  if (highRenders.length > 0) {
    findings.push({
      type: 'excessive-renders',
      severity: 'medium',
      title: `${highRenders.length} component(s) rendering excessively`,
      evidence: highRenders
        .map((m) => `${m.component ?? 'unknown'}: ${m.renderCount} renders`)
        .join(', '),
    });
    recommendations.push({
      priority: 3,
      action: 'Apply React.memo, useMemo, or useCallback to over-rendering components',
      expectedImpact: 'Reduce render cycles by 60-80%',
      effort: 'low',
      nextCommand: '/perf-front',
    });
  }

  return { findings, recommendations };
}
