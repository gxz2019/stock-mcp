import type { ToolDef } from "./types";
import { getQuoteTool } from "./quotes";
import { getKlineTool } from "./kline";
import { searchStockTool } from "./search";
import { getUsIndicesTool, getStockProfileTool } from "./us-market";
import { getCryptoOverviewTool, getCryptoTopTool, getCryptoCatsTool, getCryptoFundingTool } from "./crypto";

export * from "./types";

export const tools: ToolDef[] = [
  getQuoteTool,
  getKlineTool,
  searchStockTool,
  getUsIndicesTool,
  getStockProfileTool,
  getCryptoOverviewTool,
  getCryptoTopTool,
  getCryptoCatsTool,
  getCryptoFundingTool,
];

export const toolMap = new Map<string, ToolDef>(
  tools.map((t) => [t.tool.name, t])
);
