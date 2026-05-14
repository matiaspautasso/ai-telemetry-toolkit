import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { telemetryStore } from '@ai-telemetry-toolkit/otel';
import { tools } from './tools/index.js';

const EMPTY_RESPONSE = { data: [], message: 'No telemetry data collected yet.' };

export async function startMcpServer(): Promise<void> {
  const server = new Server(
    { name: 'ai-telemetry-toolkit', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((t) => t.name === request.params.name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      };
    }

    try {
      const result = await tool.handler(telemetryStore, request.params.arguments ?? {});
      const hasData =
        Array.isArray(result) ? result.length > 0 : Object.keys(result).length > 0;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(hasData ? result : EMPTY_RESPONSE, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Tool error: ${String(err)}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
