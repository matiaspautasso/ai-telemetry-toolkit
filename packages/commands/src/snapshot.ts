import { telemetryStore } from '@ai-telemetry-toolkit/otel';
import { generateOptimizationPlan } from '@ai-telemetry-toolkit/agents';
import {
  generateConsole,
  generateMarkdown,
  generateJson,
  generateHtml,
} from '@ai-telemetry-toolkit/reporters';
import { writeFileSync } from 'node:fs';

interface SnapshotOptions {
  format: string;
  output?: string;
}

export function runSnapshot(options: SnapshotOptions): void {
  const snapshot = telemetryStore.getSnapshot();
  const plan = generateOptimizationPlan(snapshot);
  const enriched = { ...snapshot, findings: plan.findings, recommendations: plan.recommendations };

  let output: string;
  switch (options.format) {
    case 'markdown':
      output = generateMarkdown(enriched);
      break;
    case 'json':
      output = generateJson(enriched);
      break;
    case 'html':
      output = generateHtml(enriched);
      break;
    default:
      output = generateConsole(enriched);
  }

  if (options.output) {
    writeFileSync(options.output, output);
    console.log(`Report written to ${options.output}`);
  } else {
    process.stdout.write(output + '\n');
  }
}
