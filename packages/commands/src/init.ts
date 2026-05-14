import inquirer from 'inquirer';
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, fileURLToPath } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface InitAnswers {
  serviceName: string;
  framework: string;
  storePath: string;
  addToClaudeCode: boolean;
}

const SLASH_COMMANDS = [
  'perf-snapshot',
  'perf-api',
  'perf-errors',
  'perf-db',
  'perf-front',
  'perf-plan',
  'perf-compare',
];

export async function runInit(): Promise<void> {
  console.log('\n🚀 AI Telemetry Toolkit — Interactive Setup\n');

  const answers = await inquirer.prompt<InitAnswers>([
    {
      type: 'input',
      name: 'serviceName',
      message: 'Service name (used in telemetry traces):',
      default: 'my-app',
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Which backend framework are you using?',
      choices: ['express', 'fastify', 'nestjs', 'hono', 'other'],
      default: 'express',
    },
    {
      type: 'input',
      name: 'storePath',
      message: 'Telemetry store file path:',
      default: '.telemetry-agent/store.json',
    },
    {
      type: 'confirm',
      name: 'addToClaudeCode',
      message: 'Generate MCP config for Claude Code?',
      default: true,
    },
  ]);

  const configDir = '.telemetry-agent';
  const skillsDir = join(configDir, 'skills');
  mkdirSync(skillsDir, { recursive: true });

  // Write config.json
  const config = {
    serviceName: answers.serviceName,
    framework: answers.framework,
    storePath: answers.storePath,
    version: '0.1.0',
    createdAt: new Date().toISOString(),
  };
  writeFileSync(join(configDir, 'config.json'), JSON.stringify(config, null, 2));
  console.log(`  ✔ Created ${configDir}/config.json`);

  // Write mcp.json
  if (answers.addToClaudeCode) {
    const mcpConfig = {
      mcpServers: {
        'ai-telemetry-toolkit': {
          command: 'npx',
          args: ['ai-telemetry-toolkit', 'mcp', '--store-path', answers.storePath],
        },
      },
    };
    writeFileSync(join(configDir, 'mcp.json'), JSON.stringify(mcpConfig, null, 2));
    console.log(`  ✔ Created ${configDir}/mcp.json`);
    console.log(`\n  Add this to your Claude Code MCP config:`);
    console.log(`  cat ${configDir}/mcp.json\n`);
  }

  // Write slash command definitions
  for (const cmd of SLASH_COMMANDS) {
    const content = generateSlashCommand(cmd, answers.serviceName);
    writeFileSync(join(skillsDir, `${cmd}.md`), content);
  }
  console.log(`  ✔ Created ${SLASH_COMMANDS.length} slash commands in ${skillsDir}/`);

  // Write instrumentation snippet
  const snippet = generateInstrumentationSnippet(answers.framework, answers.storePath);
  writeFileSync(join(configDir, 'instrument.js'), snippet);
  console.log(`  ✔ Created ${configDir}/instrument.js`);

  console.log(`
✅ Setup complete!

Next steps:
  1. Add instrumentation to your app entry point:
     require('./.telemetry-agent/instrument.js') // at the very top

  2. Start the MCP server:
     npx ai-telemetry-toolkit mcp

  3. In Claude Code, ask:
     /perf-snapshot

  Docs: https://github.com/your-org/ai-telemetry-toolkit
`);
}

function generateSlashCommand(cmd: string, serviceName: string): string {
  const descriptions: Record<string, string> = {
    'perf-snapshot': `Capture and analyze the full performance state of ${serviceName}. Use telemetry.getSnapshot then telemetry.explainPerformance. Return: slow endpoints, DB hotspots, errors, and prioritized recommendations.`,
    'perf-api': `Analyze API latency for ${serviceName}. Use telemetry.getSlowEndpoints (threshold 500ms) and telemetry.getBackendMetrics. Identify bottleneck type (DB/CPU/network) and recommend fixes.`,
    'perf-errors': `Investigate recent errors in ${serviceName}. Use telemetry.getRecentErrors. Group by route and status code. Identify patterns and suggest root cause fixes.`,
    'perf-db': `Analyze database performance for ${serviceName}. Use telemetry.getDbHotspots. Detect N+1 patterns (>5 identical queries), slow queries (>200ms), and missing indexes.`,
    'perf-front': `Analyze frontend performance. Use telemetry.getFrontendMetrics. Check LCP (>2.5s = poor), FID (>100ms = poor), excessive component renders. Recommend memoization or virtualization.`,
    'perf-plan': `Generate a prioritized optimization plan for ${serviceName}. Use telemetry.generateOptimizationPlan. Return: diagnosis, priority order, affected areas, and expected impact.`,
    'perf-compare': `Compare current performance vs baseline. Use telemetry.getSnapshot for current state. Ask the user for a baseline snapshot or file path. Compute deltas and flag regressions.`,
  };

  return `# /${cmd}

${descriptions[cmd] ?? `Run ${cmd} analysis for ${serviceName}.`}

## Instructions

Use the MCP tools from ai-telemetry-toolkit to gather telemetry data and produce a structured analysis report. Always include:
- A performance score (0-100)
- The top issue found
- One concrete next action
`;
}

function generateInstrumentationSnippet(framework: string, storePath: string): string {
  return `// AI Telemetry Toolkit — Auto-instrumentation
// Add this require() at the VERY TOP of your entry file (before any other imports)
// Generated by: npx ai-telemetry-toolkit init

import { initInstrumentation } from 'ai-telemetry-toolkit/otel';

initInstrumentation({
  serviceName: '${framework}-app',
  storePath: '${storePath}',
});
`;
}
