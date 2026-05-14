import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  type SpanExporter,
  type ReadableSpan,
} from '@opentelemetry/sdk-trace-base';
import { ExportResult, ExportResultCode } from '@opentelemetry/core';
import type { BackendMetric, DbQueryMetric, LogEvent } from '@ai-telemetry-toolkit/core';
import { telemetryStore } from './store.js';

class TelemetryStoreExporter implements SpanExporter {
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    for (const span of spans) {
      this.processSpan(span);
    }
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  private processSpan(span: ReadableSpan): void {
    const attrs = span.attributes;
    const durationMs = Math.round(
      (span.duration[0] * 1e9 + span.duration[1]) / 1_000_000,
    );

    const httpMethod = attrs['http.method'] as string | undefined;
    const httpRoute = (attrs['http.route'] ?? attrs['http.target']) as string | undefined;
    const httpStatus = attrs['http.status_code'] as number | undefined;
    const dbStatement = attrs['db.statement'] as string | undefined;
    const dbOperation = attrs['db.operation'] as string | undefined;
    const dbTable = attrs['db.sql.table'] as string | undefined;

    if (httpMethod && httpRoute && httpStatus !== undefined) {
      const metric: BackendMetric = {
        timestamp: Math.round(span.startTime[0] * 1000 + span.startTime[1] / 1_000_000),
        route: httpRoute,
        method: httpMethod,
        durationMs,
        status: httpStatus,
        dbQueries: 0,
        slowestSpan: span.name,
        slowestSpanMs: durationMs,
      };
      telemetryStore.addBackendMetric(metric);

      if (httpStatus >= 400) {
        const error: LogEvent = {
          timestamp: metric.timestamp,
          level: httpStatus >= 500 ? 'error' : 'warn',
          message: `HTTP ${httpStatus} ${httpMethod} ${httpRoute}`,
          statusCode: httpStatus,
          route: httpRoute,
          traceId: span.spanContext().traceId,
          attributes: {},
        };
        telemetryStore.addError(error);
      }
    }

    if (dbStatement) {
      const normalized = dbStatement.replace(/\s+/g, ' ').replace(/'[^']*'/g, '?').trim();
      const metric: DbQueryMetric = {
        timestamp: Math.round(span.startTime[0] * 1000 + span.startTime[1] / 1_000_000),
        query: dbStatement,
        durationMs,
        table: dbTable,
        operation: (dbOperation?.toUpperCase() as DbQueryMetric['operation']) ?? 'OTHER',
        normalized,
        traceId: span.spanContext().traceId,
      };
      telemetryStore.addDbMetric(metric);
    }
  }
}

let sdk: NodeSDK | null = null;

export interface InstrumentationOptions {
  serviceName?: string;
  storePath?: string;
}

export function initInstrumentation(opts: InstrumentationOptions = {}): void {
  if (sdk) return;

  telemetryStore.configure({ storePath: opts.storePath });

  const exporter = new TelemetryStoreExporter();

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: opts.serviceName ?? 'ai-telemetry-toolkit',
    }),
    spanProcessor: new BatchSpanProcessor(exporter),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();
}

export async function shutdownInstrumentation(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}
