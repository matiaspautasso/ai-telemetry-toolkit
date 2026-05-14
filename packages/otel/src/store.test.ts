import { describe, it, expect, beforeEach } from 'vitest';
import { telemetryStore } from './store.js';
import type { BackendMetric, DbQueryMetric, LogEvent } from '@ai-telemetry-toolkit/core';

const makeBackend = (overrides: Partial<BackendMetric> = {}): BackendMetric => ({
  timestamp: Date.now(),
  route: '/api/test',
  method: 'GET',
  durationMs: 200,
  status: 200,
  dbQueries: 0,
  ...overrides,
});

const makeDbMetric = (overrides: Partial<DbQueryMetric> = {}): DbQueryMetric => ({
  timestamp: Date.now(),
  query: 'SELECT * FROM users',
  durationMs: 50,
  operation: 'SELECT',
  normalized: 'SELECT * FROM users',
  ...overrides,
});

const makeError = (overrides: Partial<LogEvent> = {}): LogEvent => ({
  timestamp: Date.now(),
  level: 'error',
  message: 'Internal Server Error',
  statusCode: 500,
  attributes: {},
  ...overrides,
});

describe('TelemetryStore', () => {
  beforeEach(() => {
    telemetryStore.clear();
  });

  describe('getSnapshot', () => {
    it('returns empty arrays when no data is stored', () => {
      const snapshot = telemetryStore.getSnapshot();
      expect(snapshot.backendMetrics).toHaveLength(0);
      expect(snapshot.dbMetrics).toHaveLength(0);
      expect(snapshot.errors).toHaveLength(0);
      expect(snapshot.findings).toHaveLength(0);
    });

    it('returns metrics within the time window', () => {
      telemetryStore.addBackendMetric(makeBackend({ timestamp: Date.now() }));
      const snapshot = telemetryStore.getSnapshot(60_000);
      expect(snapshot.backendMetrics).toHaveLength(1);
    });

    it('excludes metrics outside the time window', () => {
      telemetryStore.addBackendMetric(makeBackend({ timestamp: Date.now() - 10 * 60 * 1000 }));
      const snapshot = telemetryStore.getSnapshot(60_000);
      expect(snapshot.backendMetrics).toHaveLength(0);
    });
  });

  describe('getSlowEndpoints', () => {
    it('returns endpoints above threshold sorted by duration descending', () => {
      telemetryStore.addBackendMetric(makeBackend({ route: '/fast', durationMs: 100 }));
      telemetryStore.addBackendMetric(makeBackend({ route: '/slow', durationMs: 2000 }));
      telemetryStore.addBackendMetric(makeBackend({ route: '/medium', durationMs: 800 }));

      const slow = telemetryStore.getSlowEndpoints(500);
      expect(slow).toHaveLength(2);
      expect(slow[0]?.route).toBe('/slow');
      expect(slow[1]?.route).toBe('/medium');
    });

    it('returns empty array when no endpoints exceed threshold', () => {
      telemetryStore.addBackendMetric(makeBackend({ durationMs: 100 }));
      expect(telemetryStore.getSlowEndpoints(500)).toHaveLength(0);
    });
  });

  describe('getRecentErrors', () => {
    it('returns only error-level events sorted by timestamp descending', () => {
      telemetryStore.addError(makeError({ timestamp: 1000, message: 'old error' }));
      telemetryStore.addError(makeError({ timestamp: 2000, message: 'new error' }));
      telemetryStore.addError(makeError({ level: 'warn', message: 'a warning' }));

      const errors = telemetryStore.getRecentErrors();
      expect(errors.every((e) => e.level === 'error')).toBe(true);
      expect(errors[0]?.message).toBe('new error');
    });
  });

  describe('getDbHotspots', () => {
    it('groups identical queries and sorts by count', () => {
      const q = 'SELECT * FROM products WHERE id = ?';
      telemetryStore.addDbMetric(makeDbMetric({ normalized: q, durationMs: 10 }));
      telemetryStore.addDbMetric(makeDbMetric({ normalized: q, durationMs: 20 }));
      telemetryStore.addDbMetric(makeDbMetric({ normalized: 'SELECT 1', durationMs: 5 }));

      const hotspots = telemetryStore.getDbHotspots();
      expect(hotspots[0]?.normalized).toBe(q);
      expect(hotspots[0]?.durationMs).toBe(15); // average
    });
  });
});
