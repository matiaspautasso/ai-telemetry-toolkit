import type {
  PerformanceSnapshot,
  AgentFinding,
  AgentRecommendation,
} from '@ai-telemetry-toolkit/core';
import { analyze as plan } from './OptimizationPlannerAgent.js';

export interface PerformanceAnalysis {
  findings: AgentFinding[];
  recommendations: AgentRecommendation[];
  summary: string;
  score: number;
}

function computeScore(findings: AgentFinding[]): number {
  let deductions = 0;
  for (const f of findings) {
    if (f.severity === 'critical') deductions += 25;
    else if (f.severity === 'high') deductions += 15;
    else if (f.severity === 'medium') deductions += 8;
    else deductions += 3;
  }
  return Math.max(0, 100 - deductions);
}

export function analyze(snapshot: PerformanceSnapshot): PerformanceAnalysis {
  const { findings, recommendations, summary } = plan(snapshot);
  const score = computeScore(findings);
  return { findings, recommendations, summary, score };
}
