import type { PerformanceSnapshot } from '@ai-telemetry-toolkit/core';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export function generateConsole(snapshot: PerformanceSnapshot): string {
  const lines: string[] = [
    `${c.bold}${c.cyan}╔══════════════════════════════════════╗${c.reset}`,
    `${c.bold}${c.cyan}║    AI Telemetry Toolkit — Snapshot   ║${c.reset}`,
    `${c.bold}${c.cyan}╚══════════════════════════════════════╝${c.reset}`,
    ``,
  ];

  const slow = [...snapshot.backendMetrics].sort((a, b) => b.durationMs - a.durationMs).slice(0, 5);
  if (slow.length > 0) {
    lines.push(`${c.bold}Slow Endpoints:${c.reset}`);
    slow.forEach((m, i) => {
      const color = m.durationMs > 2000 ? c.red : m.durationMs > 1000 ? c.yellow : c.green;
      lines.push(`  ${i + 1}. ${color}${m.durationMs}ms${c.reset}  ${m.method} ${m.route}  ${c.gray}(${m.dbQueries} queries)${c.reset}`);
    });
    lines.push(``);
  }

  if (snapshot.errors.length > 0) {
    lines.push(`${c.bold}${c.red}Recent Errors (${snapshot.errors.length}):${c.reset}`);
    snapshot.errors.slice(0, 3).forEach((e) => {
      lines.push(`  ${c.red}✖${c.reset} ${e.statusCode ?? ''} ${e.message}`);
    });
    lines.push(``);
  }

  if (snapshot.recommendations.length > 0) {
    lines.push(`${c.bold}Recommendations:${c.reset}`);
    snapshot.recommendations
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3)
      .forEach((r, i) => {
        lines.push(`  ${i + 1}. ${r.action}`);
        lines.push(`     ${c.gray}→ ${r.expectedImpact}${c.reset}`);
      });
    lines.push(``);
  }

  if (slow.length === 0 && snapshot.errors.length === 0) {
    lines.push(`${c.green}✓ No performance issues detected in this window.${c.reset}`);
  }

  return lines.join('\n');
}
