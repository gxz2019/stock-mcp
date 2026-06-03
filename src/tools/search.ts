import { z } from "zod";
import { default as YahooFinance } from "yahoo-finance2";
import type { ToolDef } from "./types";
import { ok, err } from "./types";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const Input = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(20).optional(),
});

export const searchStockTool: ToolDef = {
  tool: {
    name: "search_stock",
    description:
      "按关键词搜索股票或ETF，返回匹配的股票列表（含代码、名称、交易所、类型）。适用于不知道确切代码时查找标的。",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "搜索关键词，如公司名或代码，如 'Apple'、'TSLA'、'nvidia'",
        },
        limit: {
          type: "number",
          description: "最多返回条数，默认10，最大20",
        },
      },
      required: ["query"],
    },
  },
  handler: async (input) => {
    const parsed = Input.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    const { query, limit = 10 } = parsed.data;

    try {
      const res = await yf.search(query);
      const items = (res.quotes ?? []).slice(0, limit).map((q) => {
        const r = q as Record<string, unknown>;
        return {
          symbol: r.symbol,
          name: r.longname ?? r.shortname ?? "",
          exchange: r.exchange ?? "",
          type: r.typeDisp ?? r.quoteType ?? "",
        };
      });
      return ok(items);
    } catch (e) {
      return err((e as Error).message);
    }
  },
};
