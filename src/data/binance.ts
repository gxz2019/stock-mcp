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
