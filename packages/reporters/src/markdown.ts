import type { PerformanceSnapshot } from '@ai-telemetry-toolkit/core';

export function generateMarkdown(snapshot: PerformanceSnapshot): string {
  const date = new Date(snapshot.capturedAt).toISOString();
  const lines: string[] = [
    `# Performance Report`,
    ``,
    `**Captured**: ${date}  `,
    `**Window**: ${snapshot.windowMs / 1000}s`,
    ``,
  ];

  // Slow endpoints
  const sorted = [...snapshot.backendMetrics].sort((a, b) => b.durationMs - a.durationMs);
  if (sorted.length > 0) {
    lines.push(`## Top Slow Endpoints`, ``);
    lines.push(`| # | Route | Method | Duration | Status | DB Queries |`);
    lines.push(`|---|-------|--------|----------|--------|------------|`);
    sorted.slice(0, 10).forEach((m, i) => {
      lines.push(
        `| ${i + 1} | \`${m.route}\` | ${m.method} | ${m.durationMs}ms | ${m.status} | ${m.dbQueries} |`,
      );
    });
    lines.push(``);
  }

  // DB hotspots
  if (snapshot.dbMetrics.length > 0) {
    const topDb = [...snapshot.dbMetrics].sort((a, b) => b.durationMs - a.durationMs).slice(0, 5);
    lines.push(`## Database Hotspots`, ``);
    lines.push(`| Query | Avg Duration | Operation |`);
    lines.push(`|-------|-------------|-----------|`);
    topDb.forEach((m) => {
      const q = m.normalized.length > 60 ? m.normalized.slice(0, 57) + '...' : m.normalized;
      lines.push(`| \`${q}\` | ${m.durationMs}ms | ${m.operation} |`);
    });
    lines.push(``);
  }

  // Errors
  if (snapshot.errors.length > 0) {
    lines.push(`## Recent Errors`, ``);
    snapshot.errors.slice(0, 5).forEach((e) => {
      lines.push(`- **${e.statusCode ?? e.level.toUpperCase()}** ${e.route ?? ''} — ${e.message}`);
    });
    lines.push(``);
  }

  // Findings
  if (snapshot.findings.length > 0) {
    lines.push(`## Findings`, ``);
    snapshot.findings.forEach((f) => {
      const icon = f.severity === 'critical' ? '🔴' : f.severity === 'high' ? '🟠' : '🟡';
      lines.push(`### ${icon} ${f.title}`, ``);
      lines.push(`**Type**: \`${f.type}\`  `);
      lines.push(`**Evidence**: ${f.evidence}`, ``);
    });
  }

  // Recommendations
  if (snapshot.recommendations.length > 0) {
    lines.push(`## Recommendations`, ``);
    snapshot.recommendations
      .sort((a, b) => a.priority - b.priority)
      .forEach((r, i) => {
        lines.push(`${i + 1}. **${r.action}**`);
        lines.push(`   - Impact: ${r.expectedImpact}`);
        lines.push(`   - Effort: ${r.effort}`);
        if (r.nextCommand) lines.push(`   - Next: \`${r.nextCommand}\``);
      });
    lines.push(``);
  }

  return lines.join('\n');
}
