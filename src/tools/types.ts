// MCP-compatible types for tools layer

export interface ToolInputSchema {
  type: "object";
  properties?: Record<string, object>;
  required?: string[];
  [key: string]: unknown;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: ToolInputSchema;
}

export interface TextContent {
  type: "text";
  text: string;
}

export interface CallToolResult {
  content: TextContent[];
  isError?: boolean;
}

export type ToolHandler = (input: Record<string, unknown>) => Promise<CallToolResult>;

export interface ToolDef {
  tool: MCPTool;
  handler: ToolHandler;
}

export function ok(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function err(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}
