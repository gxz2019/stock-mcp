import { z } from "zod";
import { fetchAShareQuotes, fetchHKQuotes } from "../data/tencent";
import { fetchUSQuotes } from "../data/yahoo";
import { fetchCryptoTickers } from "../data/binance";
import type { ToolDef } from "./types";
import { ok, err } from "./types";

const Input = z.object({
  market: z.enum(["a-share", "hk", "us", "crypto"]),
  codes: z.array(z.string()).min(1).max(20),
});

export const getQuoteTool: ToolDef = {
  tool: {
    name: "get_quote",
    description:
      "获取股票或加密货币实时行情。支持美股（us）、A股（a-share）、港股（hk）、加密货币（crypto）。" +
      "美股示例：codes=['AAPL','NVDA']；A股：codes=['600519','000858']；港股：codes=['00700','09988']；加密：codes=['BTC','ETH']。",
    inputSchema: {
      type: "object",
      properties: {
        market: {
          type: "string",
          enum: ["a-share", "hk", "us", "crypto"],
          description: "市场类型：a-share=A股, hk=港股, us=美股, crypto=加密货币",
        },
        codes: {
          type: "array",
          items: { type: "string" },
          description: "股票/币种代码列表，最多20个",
          minItems: 1,
          maxItems: 20,
        },
      },
      required: ["market", "codes"],
    },
  },
  handler: async (input) => {
    const parsed = Input.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);
    const { market, codes } = parsed.data;

    try {
      if (market === "a-share") return ok(await fetchAShareQuotes(codes));
      if (market === "hk") return ok(await fetchHKQuotes(codes));
      if (market === "us") return ok(await fetchUSQuotes(codes));
      return ok(await fetchCryptoTickers(codes));
    } catch (e) {
      return err((e as Error).message);
    }
  },
};
