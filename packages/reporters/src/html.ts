import type { PerformanceSnapshot } from '@ai-telemetry-toolkit/core';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function generateHtml(snapshot: PerformanceSnapshot): string {
  const date = new Date(snapshot.capturedAt).toLocaleString();
  const sorted = [...snapshot.backendMetrics].sort((a, b) => b.durationMs - a.durationMs);

  const rows = sorted
    .slice(0, 20)
    .map((m) => {
      const color = m.durationMs > 2000 ? '#ef4444' : m.durationMs > 1000 ? '#f59e0b' : '#10b981';
      return `<tr>
      <td><code>${esc(m.route)}</code></td>
      <td>${esc(m.method)}</td>
      <td style="color:${color};font-weight:bold">${m.durationMs}ms</td>
      <td>${m.status}</td>
      <td>${m.dbQueries}</td>
    </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AI Telemetry Report — ${date}</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; background: #0f172a; color: #e2e8f0; }
    h1 { color: #38bdf8; } h2 { color: #94a3b8; border-bottom: 1px solid #1e293b; padding-bottom: .5rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th { background: #1e293b; padding: .5rem 1rem; text-align: left; color: #94a3b8; }
    td { padding: .5rem 1rem; border-bottom: 1px solid #1e293b; }
    code { background: #1e293b; padding: .1rem .4rem; border-radius: 4px; font-size: .9em; }
    .badge { display: inline-block; padding: .2rem .6rem; border-radius: 4px; font-size: .8em; font-weight: bold; }
    .critical { background: #7f1d1d; color: #fca5a5; } .high { background: #7c2d12; color: #fdba74; }
    .medium { background: #713f12; color: #fde68a; } .low { background: #14532d; color: #86efac; }
  </style>
</head>
<body>
  <h1>AI Telemetry Toolkit</h1>
  <p>Report generated: <strong>${date}</strong> · Window: ${snapshot.windowMs / 1000}s</p>

  <h2>Endpoints</h2>
  <table>
    <thead><tr><th>Route</th><th>Method</th><th>Duration</th><th>Status</th><th>DB Queries</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5">No data collected</td></tr>'}</tbody>
  </table>

  ${
    snapshot.findings.length > 0
      ? `<h2>Findings</h2>
  ${snapshot.findings.map((f) => `<div style="margin:.5rem 0"><span class="badge ${f.severity}">${f.severity.toUpperCase()}</span> <strong>${esc(f.title)}</strong> — ${esc(f.evidence)}</div>`).join('')}`
      : ''
  }

  ${
    snapshot.recommendations.length > 0
      ? `<h2>Recommendations</h2>
  <ol>${snapshot.recommendations.sort((a, b) => a.priority - b.priority).map((r) => `<li><strong>${esc(r.action)}</strong><br><small>${esc(r.expectedImpact)}</small></li>`).join('')}</ol>`
      : ''
  }
</body>
</html>`;
}
