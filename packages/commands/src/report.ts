import { telemetryStore } from '@ai-telemetry-toolkit/otel';
import { generateOptimizationPlan } from '@ai-telemetry-toolkit/agents';
import {
  generateMarkdown,
  generateJson,
  generateHtml,
  generateSinglePrSummary,
} from '@ai-telemetry-toolkit/reporters';
import { writeFileSync } from 'node:fs';

interface ReportOptions {
  format: string;
  output?: string;
}

export function runReport(options: ReportOptions): void {
  const snapshot = telemetryStore.getSnapshot();
  const plan = generateOptimizationPlan(snapshot);
  const enriched = { ...snapshot, findings: plan.findings, recommendations: plan.recommendations };

  let content: string;
  switch (options.format) {
    case 'html':
      content = generateHtml(enriched);
      break;
    case 'json':
      content = generateJson(enriched);
      break;
    case 'pr-summary':
      content = generateSinglePrSummary(enriched);
      break;
    default:
      content = generateMarkdown(enriched);
  }

  const outPath = options.output ?? `telemetry-report.${options.format === 'html' ? 'html' : 'md'}`;
  writeFileSync(outPath, content);
  console.log(`Report written to ${outPath}`);
}
