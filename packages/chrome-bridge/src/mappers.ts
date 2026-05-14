import type { FrontendMetric } from '@ai-telemetry-toolkit/core';
import type { LighthouseMetrics, PerformanceTraceMetrics } from './types.js';

export function mapTraceToFrontendMetrics(trace: PerformanceTraceMetrics): FrontendMetric[] {
  const ts = Date.now();
  const metrics: FrontendMetric[] = [];

  if (trace.lcp !== undefined) {
    metrics.push({
      timestamp: ts,
      type: 'lcp',
      name: 'Largest Contentful Paint',
      valueMs: trace.lcp,
      component: trace.url,
      attributes: { url: trace.url },
    });
  }

  if (trace.ttfb !== undefined) {
    metrics.push({
      timestamp: ts,
      type: 'ttfb',
      name: 'Time to First Byte',
      valueMs: trace.ttfb,
      attributes: { url: trace.url },
    });
  }

  if (trace.cls !== undefined) {
    metrics.push({
      timestamp: ts,
      type: 'cls',
      name: 'Cumulative Layout Shift',
      score: trace.cls,
      attributes: { url: trace.url },
    });
  }

  for (const insight of trace.insights) {
    metrics.push({
      timestamp: ts,
      type: 'custom',
      name: insight.name,
      valueMs: insight.estimatedSavingsMs,
      attributes: {
        description: insight.description,
        url: trace.url,
      },
    });
  }

  return metrics;
}

export function mapLighthouseToFrontendMetrics(
  lighthouse: LighthouseMetrics,
  url: string,
): FrontendMetric[] {
  const ts = Date.now();
  return [
    {
      timestamp: ts,
      type: 'custom',
      name: 'Lighthouse Accessibility',
      score: lighthouse.accessibility / 100,
      attributes: { url, audits_passed: lighthouse.passed, audits_failed: lighthouse.failed },
    },
    {
      timestamp: ts,
      type: 'custom',
      name: 'Lighthouse Best Practices',
      score: lighthouse.bestPractices / 100,
      attributes: { url },
    },
    {
      timestamp: ts,
      type: 'custom',
      name: 'Lighthouse SEO',
      score: lighthouse.seo / 100,
      attributes: { url },
    },
  ];
}
