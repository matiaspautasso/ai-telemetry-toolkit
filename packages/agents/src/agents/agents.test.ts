import { describe, it, expect } from 'vitest';
import type { PerformanceSnapshot } from '@ai-telemetry-toolkit/core';
import { analyze as analyzeDb } from './DatabaseHotspotAgent.js';
import { analyze as analyzeApi } from './ApiInspectorAgent.js';
import { analyze as analyzeErrors } from './ErrorDiagnosisAgent.js';
import { analyze as analyzePerformance } from './PerformanceAgent.js';

const makeSnapshot = (overrides: Partial<PerformanceSnapshot> = {}): PerformanceSnapshot => ({
  capturedAt: Date.now(),
  windowMs: 300_000,
  backendMetrics: [],
  dbMetrics: [],
  frontendMetrics: [],
  errors: [],
  findings: [],
  recommendations: [],
  ...overrides,
});

describe('DatabaseHotspotAgent', () => {
  it('detects N+1 when the same query runs more than 5 times', () => {
    const normalized = 'SELECT * FROM products WHERE id = ?';
    const snapshot = makeSnapshot({
      dbMetrics: Array.from({ length: 42 }, (_, i) => ({
        timestamp: Date.now(),
        query: `SELECT * FROM products WHERE id = ${i}`,
        durationMs: 10,
        operation: 'SELECT' as const,
        normalized,
      })),
    });
    const { findings } = analyzeDb(snapshot);
    expect(findings.some((f) => f.type === 'n-plus-one')).toBe(true);
    const nPlusOne = findings.find((f) => f.type === 'n-plus-one');
    expect(nPlusOne?.occurrences).toBe(42);
  });

  it('returns no findings for a healthy snapshot', () => {
    const { findings } = analyzeDb(makeSnapshot());
    expect(findings).toHaveLength(0);
  });
});

describe('ApiInspectorAgent', () => {
  it('flags critical latency for endpoints above 3s', () => {
    const snapshot = makeSnapshot({
      backendMetrics: [
        {
          timestamp: Date.now(),
          route: '/api/products',
          method: 'GET',
          durationMs: 3500,
          status: 200,
          dbQueries: 10,
        },
      ],
    });
    const { findings } = analyzeApi(snapshot);
    expect(findings.some((f) => f.severity === 'critical')).toBe(true);
  });

  it('returns no findings for fast endpoints', () => {
    const snapshot = makeSnapshot({
      backendMetrics: [
        {
          timestamp: Date.now(),
          route: '/api/health',
          method: 'GET',
          durationMs: 50,
          status: 200,
          dbQueries: 0,
        },
      ],
    });
    const { findings } = analyzeApi(snapshot);
    expect(findings.filter((f) => f.type === 'very-slow-endpoint')).toHaveLength(0);
  });
});

describe('ErrorDiagnosisAgent', () => {
  it('detects recurring 5xx pattern', () => {
    const snapshot = makeSnapshot({
      errors: Array.from({ length: 8 }, () => ({
        timestamp: Date.now(),
        level: 'error' as const,
        message: 'Internal Server Error',
        statusCode: 500,
        route: '/api/checkout',
        attributes: {},
      })),
    });
    const { findings } = analyzeErrors(snapshot);
    expect(findings.some((f) => f.type === '5xx-pattern')).toBe(true);
  });
});

describe('PerformanceAgent', () => {
  it('returns score 100 for a clean snapshot', () => {
    const { score, findings } = analyzePerformance(makeSnapshot());
    expect(findings).toHaveLength(0);
    expect(score).toBe(100);
  });

  it('returns a reduced score when critical issues exist', () => {
    const snapshot = makeSnapshot({
      backendMetrics: [
        {
          timestamp: Date.now(),
          route: '/api/slow',
          method: 'GET',
          durationMs: 5000,
          status: 200,
          dbQueries: 50,
        },
      ],
    });
    const { score } = analyzePerformance(snapshot);
    expect(score).toBeLessThan(100);
  });
});
