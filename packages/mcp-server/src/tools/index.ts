import type { TelemetryStore } from '../types.js';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; default?: unknown }>;
    required?: string[];
  };
  handler: (store: TelemetryStore, args: Record<string, unknown>) => Promise<unknown> | unknown;
}

export const tools: McpTool[] = [
  {
    name: 'telemetry.getSnapshot',
    description: 'Get a full performance snapshot of all telemetry data collected in the current window.',
    inputSchema: {
      type: 'object',
      properties: {
        windowMs: { type: 'number', description: 'Time window in milliseconds', default: 300000 },
      },
    },
    handler: (store, args) => store.getSnapshot(typeof args['windowMs'] === 'number' ? args['windowMs'] : undefined),
  },
  {
    name: 'telemetry.getSlowEndpoints',
    description: 'Get the slowest API endpoints sorted by response time descending.',
    inputSchema: {
      type: 'object',
      properties: {
        thresholdMs: { type: 'number', description: 'Minimum duration in ms to include', default: 500 },
        limit: { type: 'number', description: 'Max results to return', default: 10 },
      },
    },
    handler: (store, args) =>
      store.getSlowEndpoints(
        typeof args['thresholdMs'] === 'number' ? args['thresholdMs'] : undefined,
        typeof args['limit'] === 'number' ? args['limit'] : undefined,
      ),
  },
  {
    name: 'telemetry.getRecentErrors',
    description: 'Get the most recent error-level HTTP responses and exceptions.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max errors to return', default: 20 },
      },
    },
    handler: (store, args) =>
      store.getRecentErrors(typeof args['limit'] === 'number' ? args['limit'] : undefined),
  },
  {
    name: 'telemetry.getFrontendMetrics',
    description: 'Get frontend performance metrics (LCP, FID, CLS, render counts).',
    inputSchema: { type: 'object', properties: {} },
    handler: (store) => store.getSnapshot().frontendMetrics,
  },
  {
    name: 'telemetry.getBackendMetrics',
    description: 'Get all backend HTTP metrics collected in the current window.',
    inputSchema: { type: 'object', properties: {} },
    handler: (store) => store.getSnapshot().backendMetrics,
  },
  {
    name: 'telemetry.getDbHotspots',
    description: 'Get the most frequently executed or slowest database queries (N+1 detection).',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max queries to return', default: 10 },
      },
    },
    handler: (store, args) =>
      store.getDbHotspots(typeof args['limit'] === 'number' ? args['limit'] : undefined),
  },
  {
    name: 'telemetry.explainPerformance',
    description: 'Get a plain-language explanation of the current performance state with root cause analysis.',
    inputSchema: { type: 'object', properties: {} },
    handler: (store) => {
      const snapshot = store.getSnapshot();
      const slow = store.getSlowEndpoints(500, 3);
      const errors = store.getRecentErrors(5);
      const hotspots = store.getDbHotspots(3);

      const parts: string[] = ['## Performance Analysis\n'];

      if (slow.length > 0) {
        parts.push(`**Slow Endpoints (${slow.length}):**`);
        slow.forEach((m) => parts.push(`- \`${m.method} ${m.route}\`: ${m.durationMs}ms (${m.dbQueries} DB queries)`));
      }
      if (hotspots.length > 0) {
        parts.push(`\n**DB Hotspots:**`);
        hotspots.forEach((q) => parts.push(`- \`${q.normalized.slice(0, 80)}\`: avg ${q.durationMs}ms`));
      }
      if (errors.length > 0) {
        parts.push(`\n**Recent Errors (${errors.length}):** ${errors.map((e) => `${e.statusCode ?? ''} ${e.route ?? ''}`).join(', ')}`);
      }
      if (slow.length === 0 && errors.length === 0) {
        parts.push('No significant performance issues detected in the current window.');
      }

      return { explanation: parts.join('\n'), snapshot };
    },
  },
  {
    name: 'telemetry.generateOptimizationPlan',
    description: 'Generate a prioritized optimization action plan based on current telemetry.',
    inputSchema: { type: 'object', properties: {} },
    handler: (store) => {
      const slow = store.getSlowEndpoints(500, 5);
      const hotspots = store.getDbHotspots(5);
      const errors = store.getRecentErrors(10);

      const plan: Array<{ priority: number; area: string; action: string; impact: string }> = [];
      let priority = 1;

      if (hotspots.length > 0) {
        plan.push({ priority: priority++, area: 'database', action: `Optimize ${hotspots.length} DB hotspot(s): batch or cache repeated queries`, impact: 'High — reduces backend latency significantly' });
      }
      if (slow.length > 0) {
        plan.push({ priority: priority++, area: 'backend', action: `Profile and optimize ${slow.length} slow endpoint(s) above 500ms`, impact: 'Medium-High — improves user-perceived latency' });
      }
      if (errors.length > 0) {
        plan.push({ priority: priority++, area: 'reliability', action: `Investigate ${errors.length} recent error(s)`, impact: 'High — reduces error rate and improves reliability' });
      }
      if (plan.length === 0) {
        plan.push({ priority: 1, area: 'monitoring', action: 'Continue collecting telemetry — no critical issues found', impact: 'Preventive — establishes performance baseline' });
      }

      return { plan, generatedAt: new Date().toISOString() };
    },
  },
];
