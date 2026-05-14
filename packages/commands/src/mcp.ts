import { telemetryStore } from '@ai-telemetry-toolkit/otel';
import { startMcpServer } from '@ai-telemetry-toolkit/mcp-server';

interface McpOptions {
  storePath: string;
}

export async function runMcp(options: McpOptions): Promise<void> {
  telemetryStore.configure({ storePath: options.storePath });
  process.stderr.write('[ai-telemetry-toolkit] MCP server starting on stdio...\n');
  await startMcpServer();
}
