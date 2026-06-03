import { default as YahooFinance } from "yahoo-finance2";

// v3 需要实例化
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface USQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: string;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  marketCap: number | null;
  currency: string;
  exchange: string;
}

export interface USKlineBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number | null;
}

export interface StockProfile {
  symbol: string;
  name: string;
  sector: string | null;
  industry: string | null;
  description: string | null;
  website: string | null;
  employees: number | null;
  country: string | null;
  currency: string;
  marketCap: number | null;
  pe: number | null;
  eps: number | null;
  beta: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

// ─── Fetch Functions ──────────────────────────────────────────────────────────

export async function fetchUSQuotes(symbols: string[]): Promise<USQuote[]> {
  process.stderr.write(`[yahoo] fetchUSQuotes symbols=${symbols.join(",")}\n`);
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const q = await yf.quote(symbol);
        const result: USQuote = {
          symbol: q.symbol,
          name: (q as Record<string, unknown>).longName as string ?? (q as Record<string, unknown>).shortName as string ?? symbol,
          price: q.regularMarketPrice ?? 0,
          change: q.regularMarketChange ?? 0,
          changePercent: ((q.regularMarketChangePercent ?? 0).toFixed(2)) + "%",
          open: q.regularMarketOpen ?? 0,
          high: q.regularMarketDayHigh ?? 0,
          low: q.regularMarketDayLow ?? 0,
          prevClose: q.regularMarketPreviousClose ?? 0,
          volume: q.regularMarketVolume ?? 0,
          marketCap: (q as Record<string, unknown>).marketCap as number ?? null,
          currency: q.currency ?? "USD",
          exchange: (q as Record<string, unknown>).fullExchangeName as string ?? q.exchange ?? "",
        };
        process.stderr.write(`[yahoo] ${symbol} price=${result.price}\n`);
        return result;
      } catch (e) {
        process.stderr.write(`[yahoo] 请求失败 symbol=${symbol} err=${e}\n`);
        return null;
      }
    })
  );
  return results.filter(Boolean) as USQuote[];
}

export async function fetchUSKlines(
  symbol: string,
  startDate: string,  // YYYY-MM-DD
  endDate: string,    // YYYY-MM-DD
  interval: "1d" | "1wk" | "1mo" = "1d"
): Promise<USKlineBar[]> {
  process.stderr.write(`[yahoo] fetchUSKlines symbol=${symbol} start=${startDate} end=${endDate} interval=${interval}\n`);
  const rows = await yf.historical(symbol, {
    period1: startDate,
    period2: endDate,
    interval,
  });
  const bars: USKlineBar[] = rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    open: r.open ?? 0,
    high: r.high ?? 0,
    low: r.low ?? 0,
    close: r.close ?? 0,
    volume: r.volume ?? 0,
    adjClose: r.adjClose ?? null,
  }));
  process.stderr.write(`[yahoo] fetchUSKlines 返回 ${bars.length} 条\n`);
  return bars;
}

export async function fetchStockProfile(symbol: string): Promise<StockProfile> {
  process.stderr.write(`[yahoo] fetchStockProfile symbol=${symbol}\n`);
  const summary = await yf.quoteSummary(symbol, {
    modules: ["price", "summaryProfile", "defaultKeyStatistics"],
  });
  const price = summary.price as Record<string, unknown> | undefined;
  const profile = summary.summaryProfile as Record<string, unknown> | undefined;
  const stats = summary.defaultKeyStatistics as Record<string, unknown> | undefined;

  const result: StockProfile = {
    symbol,
    name: price?.longName as string ?? price?.shortName as string ?? symbol,
    sector: profile?.sector as string ?? null,
    industry: profile?.industry as string ?? null,
    description: profile?.longBusinessSummary as string ?? null,
    website: profile?.website as string ?? null,
    employees: profile?.fullTimeEmployees as number ?? null,
    country: profile?.country as string ?? null,
    currency: price?.currency as string ?? "USD",
    marketCap: price?.marketCap as number ?? null,
    pe: price?.trailingPE as number ?? null,
    eps: stats?.trailingEps as number ?? null,
    beta: stats?.beta as number ?? null,
    fiftyTwoWeekHigh: price?.fiftyTwoWeekHigh as number ?? null,
    fiftyTwoWeekLow: price?.fiftyTwoWeekLow as number ?? null,
  };
  process.stderr.write(`[yahoo] fetchStockProfile ${symbol} sector=${result.sector}\n`);
  return result;
}
