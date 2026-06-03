import { z } from "zod";
import { fetchAShareKline, fetchHKKline } from "../data/tencent";
import { fetchUSKlines } from "../data/yahoo";
import { fetchCryptoKlines } from "../data/binance";
import { attachIndicators } from "../utils/indicators";
import type { ToolDef } from "./types";
import { ok, err } from "./types";

const periodToYahoo: Record<string, "1d" | "1wk" | "1mo"> = {
  daily: "1d",
  weekly: "1wk",
  monthly: "1mo",
};

const Input = z.object({
  market: z.enum(["a-share", "hk", "us", "crypto"]),
  code: z.string(),
  period: z.enum(["daily", "weekly", "monthly"]).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  interval: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export const getKlineTool: ToolDef = {
  tool: {
    name: "get_kline",
    description:
      "获取K线数据（OHLCV）。股票支持 daily/weekly/monthly；加密货币支持 1m/5m/15m/1h/4h/1d/1w 等 Binance 标准周期。" +
      "美股可指定 start/end 日期（YYYY-MM-DD）；加密可指定 limit（最多500条）。",
    inputSchema: {
      type: "object",
      properties: {
        market: {
          type: "string",
          enum: ["a-share", "hk", "us", "crypto"],
          description: "市场类型",
        },
        code: {
          type: "string",
          description: "代码，如 AAPL、600519、00700、BTC",
        },
        period: {
          type: "string",
          enum: ["daily", "weekly", "monthly"],
          description: "周期（股票市场），默认 daily",
        },
        start: {
          type: "string",
          description: "开始日期 YYYY-MM-DD（仅美股，默认近90天）",
        },
        end: {
          type: "string",
          description: "结束日期 YYYY-MM-DD（仅美股，默认今天）",
        },
        interval: {
          type: "string",
          description: "加密货币周期，如 1d、4h、1h、15m，默认 1d",
        },
        limit: {
          type: "number",
          description: "加密货币返回条数，最大500，默认100",
        },
      },
      required: ["market", "code"],
    },
  },
  handler: async (input) => {
    const parsed = Input.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    const { market, code, period, start, end, interval, limit } = parsed.data;

    try {
      if (market === "a-share") {
        return ok(await fetchAShareKline(code, period ?? "daily"));
      }
      if (market === "hk") {
        return ok(await fetchHKKline(code, period ?? "daily"));
      }
      if (market === "us") {
        const endDate = end ?? new Date().toISOString().slice(0, 10);
        const startDate = start ?? new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
        const yInterval = periodToYahoo[period ?? "daily"] ?? "1d";
        return ok(await fetchUSKlines(code, startDate, endDate, yInterval));
      }
      // crypto
      return ok(await fetchCryptoKlines(code, interval ?? "1d", limit ?? 100));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

const IndicatorInput = z.object({
  market: z.enum(["us", "crypto"]),
  code: z.string(),
  period: z.enum(["daily", "weekly", "monthly"]).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  interval: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export const getKlineWithIndicatorsTool: ToolDef = {
  tool: {
    name: "get_kline_with_indicators",
    description:
      "获取K线数据并附带计算好的技术指标（MA5/10/20/60、RSI14、MACD、布林带）。" +
      "支持美股（market=us）和加密货币（market=crypto）。" +
      "返回最近数据，指标均为精确计算值，可直接用于分析。",
    inputSchema: {
      type: "object",
      properties: {
        market: {
          type: "string",
          enum: ["us", "crypto"],
          description: "市场类型：us=美股，crypto=加密货币",
        },
        code: {
          type: "string",
          description: "代码，如 AAPL、NVDA、BTC、ETH",
        },
        period: {
          type: "string",
          enum: ["daily", "weekly", "monthly"],
          description: "美股周期，默认 daily",
        },
        start: {
          type: "string",
          description: "开始日期 YYYY-MM-DD（仅美股，默认近180天）",
        },
        end: {
          type: "string",
          description: "结束日期 YYYY-MM-DD（仅美股，默认今天）",
        },
        interval: {
          type: "string",
          description: "加密货币周期，如 1d、4h、1h，默认 1d",
        },
        limit: {
          type: "number",
          description: "加密货币返回条数，默认200（指标需要足够历史数据）",
        },
      },
      required: ["market", "code"],
    },
  },
  handler: async (input) => {
    const parsed = IndicatorInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    const { market, code, period, start, end, interval, limit } = parsed.data;

    try {
      let bars: { date: string; open: number; high: number; low: number; close: number; volume: number }[];

      if (market === "us") {
        const endDate = end ?? new Date().toISOString().slice(0, 10);
        const startDate = start ?? new Date(Date.now() - 180 * 86400_000).toISOString().slice(0, 10);
        const yInterval = periodToYahoo[period ?? "daily"] ?? "1d";
        bars = await fetchUSKlines(code, startDate, endDate, yInterval);
      } else {
        bars = await fetchCryptoKlines(code, interval ?? "1d", limit ?? 200);
      }

      if (bars.length < 2) return err("数据不足，无法计算指标");

      const withIndicators = attachIndicators(bars);
      // 只返回最近60条，减少 token，但保留足够上下文
      const recent = withIndicators.slice(-60);

      return ok({
        symbol: code.toUpperCase(),
        market,
        total: bars.length,
        returned: recent.length,
        bars: recent,
      });
    } catch (e) {
      return err((e as Error).message);
    }
  },
};
