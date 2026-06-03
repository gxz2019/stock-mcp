import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CryptoTicker {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
}

export interface CryptoKlineBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

// 自动补全 USDT 后缀
export function normalizeSymbol(symbol: string): string {
  const s = symbol.toUpperCase();
  return s.endsWith("USDT") ? s : s + "USDT";
}

// ─── Fetch Functions ──────────────────────────────────────────────────────────

export async function fetchCryptoTickers(symbols: string[]): Promise<CryptoTicker[]> {
  process.stderr.write(`[binance] fetchCryptoTickers symbols=${symbols.join(",")}\n`);
  const results = await Promise.all(
    symbols.map(async (raw) => {
      const sym = normalizeSymbol(raw);
      try {
        const res = await axios.get(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`,
          { timeout: 5000 }
        );
        const d = res.data;
        process.stderr.write(`[binance] ${sym} price=${d.lastPrice}\n`);
        return {
          symbol: sym,
          price: parseFloat(d.lastPrice),
          change: parseFloat(d.priceChange),
          changePercent: parseFloat(d.priceChangePercent).toFixed(2) + "%",
          high: parseFloat(d.highPrice),
          low: parseFloat(d.lowPrice),
          volume: parseFloat(d.volume),
          quoteVolume: parseFloat(d.quoteVolume),
        } as CryptoTicker;
      } catch (e) {
        process.stderr.write(`[binance] 请求失败 symbol=${sym} err=${e}\n`);
        return null;
      }
    })
  );
  return results.filter(Boolean) as CryptoTicker[];
}

export interface MarketSentiment {
  symbol: string;
  openInterest: number;
  openInterestUnit: string;
  globalLongRatio: number;
  globalShortRatio: number;
  topAccountLongRatio: number;
  topAccountShortRatio: number;
  topPositionLongRatio: number;
  topPositionShortRatio: number;
  takerBuyRatio: number;
  takerSellRatio: number;
}

export async function fetchMarketSentiment(symbol: string, period = "1h"): Promise<MarketSentiment> {
  const sym = normalizeSymbol(symbol);
  process.stderr.write(`[binance] fetchMarketSentiment symbol=${sym} period=${period}\n`);

  const base = "https://fapi.binance.com";
  const params = `symbol=${sym}&period=${period}&limit=1`;

  const [oiRes, globalRes, topAccRes, topPosRes, takerRes] = await Promise.all([
    axios.get(`${base}/fapi/v1/openInterest?symbol=${sym}`, { timeout: 5000 }),
    axios.get(`${base}/futures/data/globalLongShortAccountRatio?${params}`, { timeout: 5000 }),
    axios.get(`${base}/futures/data/topLongShortAccountRatio?${params}`, { timeout: 5000 }),
    axios.get(`${base}/futures/data/topLongShortPositionRatio?${params}`, { timeout: 5000 }),
    axios.get(`${base}/futures/data/takerlongshortRatio?${params}`, { timeout: 5000 }),
  ]);

  const oi = oiRes.data;
  const global = globalRes.data[0] ?? {};
  const topAcc = topAccRes.data[0] ?? {};
  const topPos = topPosRes.data[0] ?? {};
  const taker = takerRes.data[0] ?? {};

  return {
    symbol: sym,
    openInterest: parseFloat(oi.openInterest),
    openInterestUnit: sym.replace("USDT", ""),
    globalLongRatio: parseFloat(global.longAccount ?? "0"),
    globalShortRatio: parseFloat(global.shortAccount ?? "0"),
    topAccountLongRatio: parseFloat(topAcc.longAccount ?? "0"),
    topAccountShortRatio: parseFloat(topAcc.shortAccount ?? "0"),
    topPositionLongRatio: parseFloat(topPos.longPosition ?? "0"),
    topPositionShortRatio: parseFloat(topPos.shortPosition ?? "0"),
    takerBuyRatio: parseFloat(taker.buySellRatio ?? "0"),
    takerSellRatio: taker.buySellRatio ? (1 / parseFloat(taker.buySellRatio)) : 0,
  };
}

export async function fetchCryptoKlines(
  symbol: string,
  interval: string = "1d",
  limit: number = 100
): Promise<CryptoKlineBar[]> {
  const sym = normalizeSymbol(symbol);
  process.stderr.write(`[binance] fetchCryptoKlines symbol=${sym} interval=${interval} limit=${limit}\n`);
  const res = await axios.get(
    `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${limit}`,
    { timeout: 5000 }
  );
  const bars: CryptoKlineBar[] = res.data.map((k: unknown[]) => ({
    date: new Date(k[0] as number).toISOString().slice(0, 10),
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
  }));
  process.stderr.write(`[binance] fetchCryptoKlines 返回 ${bars.length} 条\n`);
  return bars;
}
