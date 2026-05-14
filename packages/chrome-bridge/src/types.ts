export interface LighthouseMetrics {
  accessibility: number;
  bestPractices: number;
  seo: number;
  passed: number;
  failed: number;
}

export interface PerformanceTraceMetrics {
  url: string;
  lcp?: number;
  ttfb?: number;
  cls?: number;
  renderDelay?: number;
  insights: PerformanceInsight[];
  networkRequests?: NetworkRequestSummary[];
}

export interface PerformanceInsight {
  name: string;
  description: string;
  estimatedSavingsMs?: number;
}

export interface NetworkRequestSummary {
  url: string;
  durationMs: number;
  sizeBytes?: number;
  mimeType: string;
  statusCode: number;
  renderBlocking: boolean;
}

export interface ChromeCaptureResult {
  url: string;
  capturedAt: number;
  lighthouse: LighthouseMetrics | null;
  trace: PerformanceTraceMetrics | null;
}
