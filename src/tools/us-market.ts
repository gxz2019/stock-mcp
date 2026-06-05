import { z } from "zod";
import { fetchUSQuotes, fetchStockProfile, fetchEarningsCalendar, fetchUsMarketScan } from "../data/yahoo";
import type { ToolDef } from "./types";
import { ok, err } from "./types";

// 主要美股指数 ETF + 直接指数代码
const US_INDICES = ["^GSPC", "^IXIC", "^DJI", "^RUT", "^VIX"];
const INDEX_NAMES: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^IXIC": "Nasdaq Composite",
  "^DJI": "Dow Jones",
  "^RUT": "Russell 2000",
  "^VIX": "VIX 恐慌指数",
};

export const getUsIndicesTool: ToolDef = {
  tool: {
    name: "get_us_indices",
    description:
      "获取美股主要指数实时行情，包括标普500、纳斯达克、道琼斯、罗素2000、VIX恐慌指数。",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  handler: async () => {
    try {
      const quotes = await fetchUSQuotes(US_INDICES);
      const result = quotes.map((q) => ({
        ...q,
        indexName: INDEX_NAMES[q.symbol] ?? q.symbol,
      }));
      return ok(result);
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

const SECTOR_ETFS: Record<string, string> = {
  XLK:  "科技",
  XLF:  "金融",
  XLV:  "医疗健康",
  XLE:  "能源",
  XLI:  "工业",
  XLY:  "非必需消费",
  XLP:  "必需消费",
  XLB:  "材料",
  XLU:  "公用事业",
  XLRE: "房地产",
  XLC:  "通信服务",
};

export const getUsSectorHeatmapTool: ToolDef = {
  tool: {
    name: "get_us_sector_heatmap",
    description:
      "获取美股11大行业板块今日涨跌幅，基于 SPDR 行业 ETF（XLK/XLF/XLE 等），用于判断资金流向和板块轮动。",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  handler: async () => {
    try {
      const symbols = Object.keys(SECTOR_ETFS);
      const quotes = await fetchUSQuotes(symbols);
      const result = quotes
        .map((q) => ({
          etf: q.symbol,
          sector: SECTOR_ETFS[q.symbol] ?? q.symbol,
          price: q.price,
          change: q.change,
          changePercent: q.changePercent,
          volume: q.volume,
        }))
        .sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent));
      return ok(result);
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

export const getUsMarketScanTool: ToolDef = {
  tool: {
    name: "get_us_market_scan",
    description:
      "扫描 S&P 500 全部约500只股票，按量比（今日成交量/90日均量）、涨幅、跌幅各取 Top N 返回。" +
      "量比越高代表当日异动越强烈，是发现今日热点的核心信号。适合日报选股、盘后复盘。",
    inputSchema: {
      type: "object",
      properties: {
        topN: {
          type: "number",
          description: "各榜单返回数量，默认20，最大50",
        },
      },
      required: [],
    },
  },
  handler: async (input) => {
    const n = Math.min(Number((input as Record<string, unknown>).topN ?? 20), 50);
    try {
      const result = await fetchUsMarketScan(n);
      return ok(result);
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

const SymbolInput = z.object({
  symbol: z.string().min(1),
});

export const getEarningsCalendarTool: ToolDef = {
  tool: {
    name: "get_earnings_calendar",
    description:
      "查询美股上市公司的下次财报日期、EPS预期，以及近4季度的实际EPS、预期EPS和超预期幅度（surprise%）。",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "美股代码，如 AAPL、NVDA、TSLA",
        },
      },
      required: ["symbol"],
    },
  },
  handler: async (input) => {
    const parsed = SymbolInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    try {
      return ok(await fetchEarningsCalendar(parsed.data.symbol));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};

const ProfileInput = z.object({
  symbol: z.string().min(1),
});

export const getStockProfileTool: ToolDef = {
  tool: {
    name: "get_stock_profile",
    description:
      "获取美股上市公司基本面信息：行业、市值、PE、EPS、Beta、52周高低点、员工数、公司简介等。",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "美股代码，如 AAPL、TSLA、NVDA",
        },
      },
      required: ["symbol"],
    },
  },
  handler: async (input) => {
    const parsed = ProfileInput.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    const { symbol } = parsed.data;

    try {
      const profile = await fetchStockProfile(symbol);
      return ok(profile);
    } catch (e) {
      return err((e as Error).message);
    }
  },
};
