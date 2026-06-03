import type { ToolDef } from "./types";
import { getQuoteTool } from "./quotes";
import { getKlineTool, getKlineWithIndicatorsTool } from "./kline";
import { searchStockTool } from "./search";
import { getUsIndicesTool, getStockProfileTool, getEarningsCalendarTool, getUsSectorHeatmapTool } from "./us-market";
import { getCryptoOverviewTool, getCryptoTopTool, getCryptoCatsTool, getCryptoFundingTool, getCryptoLiquidationTool } from "./crypto";

export * from "./types";

export const tools: ToolDef[] = [
  getQuoteTool,
  getKlineTool,
  getKlineWithIndicatorsTool,
  searchStockTool,
  getUsIndicesTool,
  getStockProfileTool,
  getEarningsCalendarTool,
  getUsSectorHeatmapTool,
  getCryptoOverviewTool,
  getCryptoTopTool,
  getCryptoCatsTool,
  getCryptoFundingTool,
  getCryptoLiquidationTool,
];

export const toolMap = new Map<string, ToolDef>(
  tools.map((t) => [t.tool.name, t])
);
