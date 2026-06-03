import { z } from "zod";
import {
  fetchFinancials,
  fetchAnalystRating,
  fetchStockNews,
  fetchInsiderActivity,
  fetchUSQuotes,
  fetchStockProfile,
} from "../data/yahoo";
import type { ToolDef } from "./types";
import { ok, err } from "./types";

const SymbolInput = z.object({ symbol: z.string().min(1) });

// ─── get_financials ───────────────────────────────────────────────────────────

const FinancialsInput = z.object({
  symbol: z.string().min(1),
  quarterly: z.boolean().optional(),
});

export const getFinancialsTool: ToolDef = {
  tool: {
    name: "get_financials",
    description:
      "获取美股财务数据：营收、毛利率、净利润、净利率、EPS、自由现金流、负债率。" +
      "默认返回近4年年报，quarterly=true 返回近4季度季报。",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "美股代码，如 AAPL、NVDA" },
        quarterly: { type: "boolean", description: "true=季报，false=年报（默认）" },
      },
      required: ["symbol"],
    },
  },
  handler: async (input) => {
    const parsed = FinancialsInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    try {
      return ok(await fetchFinancials(parsed.data.symbol, parsed.data.quarterly ?? false));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

// ─── get_analyst_rating ───────────────────────────────────────────────────────

export const getAnalystRatingTool: ToolDef = {
  tool: {
    name: "get_analyst_rating",
    description:
      "获取华尔街分析师评级：共识评级（buy/hold/sell）、平均目标价、高低目标价、" +
      "强买/买/持有/卖/强卖人数分布，以及最近10条评级变动记录。",
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
      return ok(await fetchAnalystRating(parsed.data.symbol));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

// ─── get_stock_news ───────────────────────────────────────────────────────────

const NewsInput = z.object({
  symbol: z.string().min(1),
  limit: z.number().int().min(1).max(30).optional(),
});

export const getStockNewsTool: ToolDef = {
  tool: {
    name: "get_stock_news",
    description:
      "获取美股个股最新新闻（近7天），含标题、摘要、链接、发布时间。最多30条，默认15条。",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "美股代码，如 AAPL、NVDA" },
        limit: { type: "number", description: "返回条数，默认15，最大30" },
      },
      required: ["symbol"],
    },
  },
  handler: async (input) => {
    const parsed = NewsInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    try {
      return ok(await fetchStockNews(parsed.data.symbol, parsed.data.limit ?? 15));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

// ─── get_insider_activity ─────────────────────────────────────────────────────

export const getInsiderActivityTool: ToolDef = {
  tool: {
    name: "get_insider_activity",
    description:
      "获取美股内部人（高管/董事）近期买卖记录，基于 SEC Form 4 公开数据。" +
      "含交易人姓名、职位、交易类型、股数、交易金额。",
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
      return ok(await fetchInsiderActivity(parsed.data.symbol));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

// ─── get_stock_full_overview ──────────────────────────────────────────────────

export const getStockFullOverviewTool: ToolDef = {
  tool: {
    name: "get_stock_full_overview",
    description:
      "一次调用获取美股完整分析数据：实时行情 + 公司基本面 + 分析师评级 + 近期新闻（并行获取）。" +
      "适合回答综合分析类问题（如：帮我分析一下 NVDA），避免多次调用不同工具。",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "美股代码，如 AAPL、NVDA、TSLA" },
      },
      required: ["symbol"],
    },
  },
  handler: async (input) => {
    const parsed = SymbolInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    const { symbol } = parsed.data;

    try {
      const [quotes, profile, analyst, news] = await Promise.allSettled([
        fetchUSQuotes([symbol]),
        fetchStockProfile(symbol),
        fetchAnalystRating(symbol),
        fetchStockNews(symbol, 10),
      ]);

      return ok({
        symbol,
        quote: quotes.status === "fulfilled" ? quotes.value[0] ?? null : null,
        profile: profile.status === "fulfilled" ? profile.value : null,
        analyst: analyst.status === "fulfilled" ? analyst.value : null,
        news: news.status === "fulfilled" ? news.value : [],
      });
    } catch (e) {
      return err((e as Error).message);
    }
  },
};
