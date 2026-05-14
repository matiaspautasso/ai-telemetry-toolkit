export interface TraceEvent {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTimeMs: number;
  durationMs: number;
  attributes: Record<string, string | number | boolean>;
  status: 'ok' | 'error' | 'unset';
}

export interface LogEvent {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  statusCode?: number;
  route?: string;
  traceId?: string;
  attributes: Record<string, string | number | boolean>;
}

export interface ApiRequest {
  requestId: string;
  route: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  startTimeMs: number;
  durationMs: number;
  statusCode: number;
  requestSize?: number;
  responseSize?: number;
  userAgent?: string;
}

export interface FrontendMetric {
  timestamp: number;
  type: 'lcp' | 'fid' | 'cls' | 'ttfb' | 'fcp' | 'render' | 'custom';
  name: string;
  valueMs?: number;
  score?: number;
  component?: string;
  renderCount?: number;
  attributes: Record<string, string | number | boolean>;
}

export interface BackendMetric {
  timestamp: number;
  route: string;
  method: string;
  durationMs: number;
  status: number;
  dbQueries: number;
  slowestSpan?: string;
  slowestSpanMs?: number;
  requestSize?: number;
  responseSize?: number;
}

export interface DbQueryMetric {
  timestamp: number;
  query: string;
  durationMs: number;
  rowCount?: number;
  table?: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER';
  normalized: string;
  traceId?: string;
}

export interface PerformanceSnapshot {
  capturedAt: number;
  windowMs: number;
  backendMetrics: BackendMetric[];
  dbMetrics: DbQueryMetric[];
  frontendMetrics: FrontendMetric[];
  errors: LogEvent[];
  findings: AgentFinding[];
  recommendations: AgentRecommendation[];
}

export interface AgentFinding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  evidence: string;
  affectedRoute?: string;
  affectedQuery?: string;
  occurrences?: number;
}

export interface AgentRecommendation {
  priority: number;
  action: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  nextCommand?: string;
  relatedFiles?: string[];
}
