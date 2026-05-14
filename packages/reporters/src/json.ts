import type { PerformanceSnapshot } from '@ai-telemetry-toolkit/core';

export function generateJson(snapshot: PerformanceSnapshot, pretty = true): string {
  return JSON.stringify(snapshot, null, pretty ? 2 : undefined);
}
