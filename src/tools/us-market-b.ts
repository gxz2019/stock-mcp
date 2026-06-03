import { z } from "zod";
import {
  fetchMarketMovers,
  fetchDividendHistory,
  fetchInstitutionalHolders,
  fetchSimilarStocks,
  fetchShortInterest,
} from "../data/yahoo";
import type { ToolDef } from "./types";
import { ok, err } from "./types";

// ─── get_market_movers ────────────────────────────────────────────────────────

const MoversInput = z.object({
  type: z.enum(["gainers", "losers", "actives"]).optional(),
  count: z.number().int().min(1).max(50).optional(),
});

export const getMarketMoversTool: ToolDef = {
  tool: {
    name: "get_market_movers",
    description:
      "获取美股当日榜单：涨幅榜（gainers）、跌幅榜（losers）、成交量异动榜（actives）。默认返回涨幅榜 Top 20。",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["gainers", "losers", "actives"],
          description: "榜单类型：gainers=涨幅榜，losers=跌幅榜，actives=成交量榜，默认 gainers",
        },
        count: {
          type: "number",
          description: "返回数量，默认20，最大50",
        },
      },
      required: [],
    },
  },
  handler: async (input) => {
    const parsed = MoversInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    try {
      return ok(await fetchMarketMovers(parsed.data.type ?? "gainers", parsed.data.count ?? 20));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

// ─── get_dividend_history ─────────────────────────────────────────────────────

const SymbolInput = z.object({ symbol: z.string().min(1) });

export const getDividendHistoryTool: ToolDef = {
  tool: {
    name: "get_dividend_history",
    description:
      "获取美股分红数据：当前股息率、年化分红额、除息日、近5年分红历史记录。适合判断公司是否稳定派息。",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "美股代码，如 AAPL、JNJ、KO" },
      },
      required: ["symbol"],
    },
  },
  handler: async (input) => {
    const parsed = SymbolInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    try {
      return ok(await fetchDividendHistory(parsed.data.symbol));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

// ─── get_institutional_holders ────────────────────────────────────────────────

export const getInstitutionalHoldersTool: ToolDef = {
  tool: {
    name: "get_institutional_holders",
    description:
      "获取美股前10大机构持仓：机构名称、持股比例、持股数量、持仓市值、最新报告日期。",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "美股代码，如 AAPL、NVDA" },
      },
      required: ["symbol"],
    },
  },
  handler: async (input) => {
    const parsed = SymbolInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    try {
      return ok(await fetchInstitutionalHolders(parsed.data.symbol));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

// ─── get_similar_stocks ───────────────────────────────────────────────────────

export const getSimilarStocksTool: ToolDef = {
  tool: {
    name: "get_similar_stocks",
    description:
      "获取与指定股票同行业的可比公司列表，含实时价格、涨跌幅、市值、PE、行业分类。适合横向估值对比。",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "美股代码，如 NVDA、TSLA、AAPL" },
      },
      required: ["symbol"],
    },
  },
  handler: async (input) => {
    const parsed = SymbolInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    try {
      return ok(await fetchSimilarStocks(parsed.data.symbol));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

// ─── get_short_interest ───────────────────────────────────────────────────────

export const getShortInterestTool: ToolDef = {
  tool: {
    name: "get_short_interest",
    description:
      "获取美股做空数据：空头股数、做空占流通盘比例、空头回补天数（Short Ratio）、与上月对比变化。" +
      "空头回补天数越高代表逼空风险越大。",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "美股代码，如 GME、TSLA、NVDA" },
      },
      required: ["symbol"],
    },
  },
  handler: async (input) => {
    const parsed = SymbolInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    try {
      return ok(await fetchShortInterest(parsed.data.symbol));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};
