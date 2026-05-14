#!/usr/bin/env node
import { Command } from 'commander';
import { runInit } from './init.js';
import { runSnapshot } from './snapshot.js';
import { runReport } from './report.js';
import { runMcp } from './mcp.js';

const program = new Command();

program
  .name('ai-telemetry-toolkit')
  .description('AI-powered performance telemetry toolkit — connect your app to AI agents via MCP + OpenTelemetry')
  .version('0.1.0');

program
  .command('init')
  .description('Run the AI-assisted interactive installer')
  .action(runInit);

program
  .command('snapshot')
  .description('Capture and display the current performance snapshot')
  .option('-f, --format <format>', 'Output format: console | markdown | json | html', 'console')
  .option('-o, --output <path>', 'Write output to file')
  .action(runSnapshot);

program
  .command('report')
  .description('Generate a full performance report')
  .option('-f, --format <format>', 'Output format: markdown | html | json | pr-summary', 'markdown')
  .option('-o, --output <path>', 'Write report to file (required for html)')
  .action(runReport);

program
  .command('mcp')
  .description('Start the MCP server for Claude Code / Codex integration')
  .option('--store-path <path>', 'Path to telemetry JSON store file', '.telemetry-agent/store.json')
  .action(runMcp);

program.parse();
