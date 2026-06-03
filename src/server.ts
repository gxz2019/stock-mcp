import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { tools, toolMap } from "./tools/index";

const server = new Server(
  { name: "stock-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 返回所有已注册的 tools 列表
// eslint-disable-next-line @typescript-eslint/no-explicit-any
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => t.tool) as any,
}));

// 路由到对应 tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const def = toolMap.get(name);
  if (!def) {
    return {
      content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }
  return def.handler((args ?? {}) as Record<string, unknown>) as any;
});

export async function startServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`[stock-mcp] server started — ${tools.length} tools registered\n`);
  for (const t of tools) {
    process.stderr.write(`  · ${t.tool.name}\n`);
  }
}
