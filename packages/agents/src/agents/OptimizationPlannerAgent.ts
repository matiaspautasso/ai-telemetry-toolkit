import type {
  PerformanceSnapshot,
  AgentFinding,
  AgentRecommendation,
} from '@ai-telemetry-toolkit/core';
import { analyze as analyzeApi } from './ApiInspectorAgent.js';
import { analyze as analyzeDb } from './DatabaseHotspotAgent.js';
import { analyze as analyzeFrontend } from './FrontendRenderAgent.js';
import { analyze as analyzeErrors } from './ErrorDiagnosisAgent.js';

export interface OptimizationPlan {
  findings: AgentFinding[];
  recommendations: AgentRecommendation[];
  summary: string;
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function analyze(snapshot: PerformanceSnapshot): OptimizationPlan {
  const api = analyzeApi(snapshot);
  const db = analyzeDb(snapshot);
  const frontend = analyzeFrontend(snapshot);
  const errors = analyzeErrors(snapshot);

  const allFindings: AgentFinding[] = [
    ...errors.findings,
    ...db.findings,
    ...api.findings,
    ...frontend.findings,
  ].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const allRecs: AgentRecommendation[] = [
    ...errors.recommendations,
    ...db.recommendations,
    ...api.recommendations,
    ...frontend.recommendations,
  ]
    .sort((a, b) => a.priority - b.priority)
    .map((r, i) => ({ ...r, priority: i + 1 }));

  const criticalCount = allFindings.filter((f) => f.severity === 'critical').length;
  const highCount = allFindings.filter((f) => f.severity === 'high').length;

  let summary: string;
  if (allFindings.length === 0) {
    summary = 'No significant performance issues detected. System appears healthy.';
  } else {
    summary = `Found ${allFindings.length} issue(s): ${criticalCount} critical, ${highCount} high priority. Top recommendation: ${allRecs[0]?.action ?? 'review findings'}`;
  }

  return { findings: allFindings, recommendations: allRecs, summary };
}
