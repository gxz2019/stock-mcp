import type { ToolDef } from "./types";
import { getQuoteTool } from "./quotes";
import { getKlineTool, getKlineWithIndicatorsTool } from "./kline";
import { searchStockTool } from "./search";
import { getUsIndicesTool, getStockProfileTool, getEarningsCalendarTool, getUsSectorHeatmapTool, getUsMarketScanTool } from "./us-market";
import { getCryptoOverviewTool, getCryptoTopTool, getCryptoCatsTool, getCryptoFundingTool, getCryptoLiquidationTool } from "./crypto";
import { getFinancialsTool, getAnalystRatingTool, getStockNewsTool, getInsiderActivityTool, getStockFullOverviewTool } from "./us-fundamentals";
import { getMarketMoversTool, getDividendHistoryTool, getInstitutionalHoldersTool, getSimilarStocksTool, getShortInterestTool } from "./us-market-b";

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
  getUsMarketScanTool,
  getCryptoOverviewTool,
  getCryptoTopTool,
  getCryptoCatsTool,
  getCryptoFundingTool,
  getCryptoLiquidationTool,
  getFinancialsTool,
  getAnalystRatingTool,
  getStockNewsTool,
  getInsiderActivityTool,
  getStockFullOverviewTool,
  getMarketMoversTool,
  getDividendHistoryTool,
  getInstitutionalHoldersTool,
  getSimilarStocksTool,
  getShortInterestTool,
];

export const toolMap = new Map<string, ToolDef>(
  tools.map((t) => [t.tool.name, t])
);
