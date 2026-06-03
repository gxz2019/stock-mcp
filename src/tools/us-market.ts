import { z } from "zod";
import { fetchUSQuotes, fetchStockProfile } from "../data/yahoo";
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
