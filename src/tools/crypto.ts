import { z } from "zod";
import axios from "axios";
import { fetchGlobalMarket, fetchTopCoins, fetchFearGreed, fetchCategories } from "../data/coingecko";
import { fetchMarketSentiment } from "../data/binance";
import type { ToolDef } from "./types";
import { ok, err } from "./types";

export const getCryptoOverviewTool: ToolDef = {
  tool: {
    name: "get_crypto_overview",
    description:
      "获取加密货币市场全局概况：总市值、24h成交量、BTC/ETH占比、市值变化，以及恐惧贪婪指数。",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  handler: async () => {
    try {
      const [market, fg] = await Promise.all([fetchGlobalMarket(), fetchFearGreed()]);
      return ok({ market, fearGreed: fg });
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

const TopCoinsInput = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const getCryptoTopTool: ToolDef = {
  tool: {
    name: "get_crypto_top",
    description: "按市值排名获取 Top N 加密货币，含价格、涨跌幅、市值、24h成交量。默认 Top 20。",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "返回数量，默认20，最大100",
        },
      },
      required: [],
    },
  },
  handler: async (input) => {
    const parsed = TopCoinsInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    const { limit = 20 } = parsed.data;

    try {
      return ok(await fetchTopCoins(limit));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

export const getCryptoCatsTool: ToolDef = {
  tool: {
    name: "get_crypto_categories",
    description: "获取加密货币赛道分类数据（DeFi、Layer1、AI、GameFi等），含各赛道市值和24h涨跌幅。",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  handler: async () => {
    try {
      const cats = await fetchCategories();
      const sorted = cats.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
      return ok(sorted);
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

const FundingInput = z.object({
  symbols: z.array(z.string()).min(1).max(20),
});

interface FundingRate {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
}

export const getCryptoFundingTool: ToolDef = {
  tool: {
    name: "get_funding_rate",
    description:
      "获取 Binance 永续合约资金费率。symbols 传币种代码，如 ['BTC','ETH']，自动补全 USDT 后缀。",
    inputSchema: {
      type: "object",
      properties: {
        symbols: {
          type: "array",
          items: { type: "string" },
          description: "币种代码列表，如 ['BTC','ETH','SOL']",
          minItems: 1,
          maxItems: 20,
        },
      },
      required: ["symbols"],
    },
  },
  handler: async (input) => {
    const parsed = FundingInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    const { symbols } = parsed.data;

    try {
      const results = await Promise.all(
        symbols.map(async (raw) => {
          const sym = raw.toUpperCase().endsWith("USDT") ? raw.toUpperCase() : raw.toUpperCase() + "USDT";
          try {
            const res = await axios.get<FundingRate>(
              `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${sym}`,
              { timeout: 5000 }
            );
            const d = res.data;
            return {
              symbol: sym,
              markPrice: parseFloat(d.markPrice),
              indexPrice: parseFloat(d.indexPrice),
              fundingRate: parseFloat(d.lastFundingRate),
              fundingRatePct: (parseFloat(d.lastFundingRate) * 100).toFixed(4) + "%",
              nextFundingTime: new Date(d.nextFundingTime).toISOString(),
            };
          } catch {
            return { symbol: sym, error: "not found or not a perpetual contract" };
          }
        })
      );
      return ok(results);
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

const LiquidationInput = z.object({
  symbols: z.array(z.string()).min(1).max(10),
  period: z.enum(["5m", "15m", "30m", "1h", "4h", "1d"]).optional(),
});

export const getCryptoLiquidationTool: ToolDef = {
  tool: {
    name: "get_crypto_liquidation",
    description:
      "获取加密货币合约市场情绪数据：未平仓合约（OI）、全球多空账户比、主力多空持仓比、吃单买卖比。" +
      "可用于判断杠杆聚集程度和清算风险。symbols 传币种代码如 ['BTC','ETH']。",
    inputSchema: {
      type: "object",
      properties: {
        symbols: {
          type: "array",
          items: { type: "string" },
          description: "币种代码列表，如 ['BTC','ETH']",
          minItems: 1,
          maxItems: 10,
        },
        period: {
          type: "string",
          enum: ["5m", "15m", "30m", "1h", "4h", "1d"],
          description: "统计周期，默认 1h",
        },
      },
      required: ["symbols"],
    },
  },
  handler: async (input) => {
    const parsed = LiquidationInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    const { symbols, period = "1h" } = parsed.data;

    try {
      const results = await Promise.all(
        symbols.map(async (sym) => {
          try {
            return await fetchMarketSentiment(sym, period);
          } catch {
            return { symbol: sym.toUpperCase() + "USDT", error: "not available or not a perpetual contract" };
          }
        })
      );
      return ok(results);
    } catch (e) {
      return err((e as Error).message);
    }
  },
};
