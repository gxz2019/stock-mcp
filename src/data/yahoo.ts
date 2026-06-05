import { default as YahooFinance } from "yahoo-finance2";
import axios from "axios";

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
  averageVolume: number | null;
  volumeRatio: number | null;
  marketState: string | null;
  postMarketPrice: number | null;
  postMarketChange: number | null;
  postMarketChangePercent: string | null;
  preMarketPrice: number | null;
  preMarketChange: number | null;
  preMarketChangePercent: string | null;
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
        const raw = q as Record<string, unknown>;
        const postPct = raw.postMarketChangePercent != null ? Number(raw.postMarketChangePercent) : null;
        const prePct = raw.preMarketChangePercent != null ? Number(raw.preMarketChangePercent) : null;
        const result: USQuote = {
          symbol: q.symbol,
          name: raw.longName as string ?? raw.shortName as string ?? symbol,
          price: q.regularMarketPrice ?? 0,
          change: q.regularMarketChange ?? 0,
          changePercent: ((q.regularMarketChangePercent ?? 0).toFixed(2)) + "%",
          open: q.regularMarketOpen ?? 0,
          high: q.regularMarketDayHigh ?? 0,
          low: q.regularMarketDayLow ?? 0,
          prevClose: q.regularMarketPreviousClose ?? 0,
          volume: q.regularMarketVolume ?? 0,
          marketCap: raw.marketCap as number ?? null,
          currency: q.currency ?? "USD",
          exchange: raw.fullExchangeName as string ?? q.exchange ?? "",
          averageVolume: raw.averageDailyVolume3Month != null ? Number(raw.averageDailyVolume3Month) : null,
          volumeRatio: raw.averageDailyVolume3Month != null && (q.regularMarketVolume ?? 0) > 0
            ? Math.round((q.regularMarketVolume! / Number(raw.averageDailyVolume3Month)) * 100) / 100
            : null,
          marketState: raw.marketState as string ?? null,
          postMarketPrice: raw.postMarketPrice != null ? Number(raw.postMarketPrice) : null,
          postMarketChange: raw.postMarketChange != null ? Number(raw.postMarketChange) : null,
          postMarketChangePercent: postPct != null ? postPct.toFixed(2) + "%" : null,
          preMarketPrice: raw.preMarketPrice != null ? Number(raw.preMarketPrice) : null,
          preMarketChange: raw.preMarketChange != null ? Number(raw.preMarketChange) : null,
          preMarketChangePercent: prePct != null ? prePct.toFixed(2) + "%" : null,
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

export interface EarningsCalendar {
  symbol: string;
  nextEarningsDate: string | null;
  earningsDatesRange: string | null;
  exDividendDate: string | null;
  dividendDate: string | null;
  recentEPS: { date: string; actual: number | null; estimate: number | null; surprise: number | null }[];
}

export async function fetchEarningsCalendar(symbol: string): Promise<EarningsCalendar> {
  process.stderr.write(`[yahoo] fetchEarningsCalendar symbol=${symbol}\n`);
  const summary = await yf.quoteSummary(symbol, {
    modules: ["calendarEvents", "earningsHistory"],
  });

  const cal = summary.calendarEvents as Record<string, unknown> | undefined;
  const history = summary.earningsHistory as Record<string, unknown> | undefined;

  // 财报日期
  const earningsDates = cal?.earnings as Record<string, unknown> | undefined;
  const dateArr = earningsDates?.earningsDate as Date[] | undefined;
  const nextDate = dateArr && dateArr.length > 0 ? dateArr[0] : null;
  const endDate = dateArr && dateArr.length > 1 ? dateArr[dateArr.length - 1] : null;

  // 近期 EPS 历史
  const histArr = (history?.history as Record<string, unknown>[] | undefined) ?? [];
  const recentEPS = histArr.slice(-4).map((h) => {
    const date = h.quarter instanceof Date ? h.quarter.toISOString().slice(0, 10) : String(h.quarter ?? "");
    const actual = typeof h.epsActual === "number" ? h.epsActual : null;
    const estimate = typeof h.epsEstimate === "number" ? h.epsEstimate : null;
    const surprise = actual !== null && estimate !== null && estimate !== 0
      ? Math.round(((actual - estimate) / Math.abs(estimate)) * 10000) / 100
      : null;
    return { date, actual, estimate, surprise };
  });

  return {
    symbol,
    nextEarningsDate: nextDate ? (nextDate as Date).toISOString().slice(0, 10) : null,
    earningsDatesRange: nextDate && endDate
      ? `${(nextDate as Date).toISOString().slice(0, 10)} ~ ${(endDate as Date).toISOString().slice(0, 10)}`
      : null,
    exDividendDate: cal?.exDividendDate instanceof Date
      ? cal.exDividendDate.toISOString().slice(0, 10) : null,
    dividendDate: cal?.dividendDate instanceof Date
      ? cal.dividendDate.toISOString().slice(0, 10) : null,
    recentEPS,
  };
}

// ─── Financials ───────────────────────────────────────────────────────────────

export interface FinancialPeriod {
  date: string;
  totalRevenue: number | null;
  grossProfit: number | null;
  grossMargin: number | null;
  netIncome: number | null;
  netMargin: number | null;
  epsDiluted: number | null;
  operatingCashFlow: number | null;
  freeCashFlow: number | null;
  totalDebt: number | null;
  stockholdersEquity: number | null;
  debtToEquity: number | null;
}

export async function fetchFinancials(symbol: string, quarterly = false): Promise<FinancialPeriod[]> {
  process.stderr.write(`[yahoo] fetchFinancials symbol=${symbol} quarterly=${quarterly}\n`);
  const modules = quarterly
    ? ["incomeStatementHistoryQuarterly", "cashflowStatementHistoryQuarterly", "balanceSheetHistoryQuarterly"]
    : ["incomeStatementHistory", "cashflowStatementHistory", "balanceSheetHistory"];

  const summary = await yf.quoteSummary(symbol, { modules: modules as never[] });

  const incomeKey = quarterly ? "incomeStatementHistoryQuarterly" : "incomeStatementHistory";
  const cashKey = quarterly ? "cashflowStatementHistoryQuarterly" : "cashflowStatementHistory";
  const balanceKey = quarterly ? "balanceSheetHistoryQuarterly" : "balanceSheetHistory";

  const incomeArr = ((summary[incomeKey as keyof typeof summary] as Record<string, unknown>)
    ?.incomeStatementHistory as Record<string, unknown>[]) ?? [];
  const cashArr = ((summary[cashKey as keyof typeof summary] as Record<string, unknown>)
    ?.cashflowStatements as Record<string, unknown>[]) ?? [];
  const balanceArr = ((summary[balanceKey as keyof typeof summary] as Record<string, unknown>)
    ?.balanceSheetStatements as Record<string, unknown>[]) ?? [];

  return incomeArr.slice(0, 4).map((inc, i) => {
    const cash = cashArr[i] ?? {};
    const bal = balanceArr[i] ?? {};
    const date = inc.endDate instanceof Date ? inc.endDate.toISOString().slice(0, 10) : String(inc.endDate ?? "");
    const revenue = inc.totalRevenue as number | null ?? null;
    const gross = inc.grossProfit as number | null ?? null;
    const net = inc.netIncome as number | null ?? null;
    const opCash = cash.totalCashFromOperatingActivities as number | null ?? null;
    const capex = cash.capitalExpenditures as number | null ?? null;
    const debt = bal.totalDebt as number | null ?? (bal.longTermDebt as number | null ?? null);
    const equity = bal.totalStockholderEquity as number | null ?? null;

    return {
      date,
      totalRevenue: revenue,
      grossProfit: gross,
      grossMargin: revenue && gross ? Math.round((gross / revenue) * 10000) / 100 : null,
      netIncome: net,
      netMargin: revenue && net ? Math.round((net / revenue) * 10000) / 100 : null,
      epsDiluted: inc.dilutedEPS as number | null ?? null,
      operatingCashFlow: opCash,
      freeCashFlow: opCash !== null && capex !== null ? opCash + capex : null,
      totalDebt: debt,
      stockholdersEquity: equity,
      debtToEquity: debt !== null && equity !== null && equity !== 0
        ? Math.round((debt / equity) * 100) / 100 : null,
    };
  });
}

// ─── Analyst Rating ───────────────────────────────────────────────────────────

export interface AnalystRating {
  symbol: string;
  consensus: string | null;
  targetPriceMean: number | null;
  targetPriceHigh: number | null;
  targetPriceLow: number | null;
  distribution: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number };
  recentChanges: { date: string; firm: string; action: string; from: string | null; to: string | null }[];
  lastActionDate: string | null;
  daysSinceLastAction: number | null;
  stalenessWarning: string | null;
}

export async function fetchAnalystRating(symbol: string): Promise<AnalystRating> {
  process.stderr.write(`[yahoo] fetchAnalystRating symbol=${symbol}\n`);
  const summary = await yf.quoteSummary(symbol, {
    modules: ["financialData", "recommendationTrend", "upgradeDowngradeHistory"],
  });

  const fin = summary.financialData as Record<string, unknown> | undefined;
  const trend = summary.recommendationTrend as Record<string, unknown> | undefined;
  const history = summary.upgradeDowngradeHistory as Record<string, unknown> | undefined;

  const trendArr = (trend?.trend as Record<string, unknown>[]) ?? [];
  const latest = trendArr[0] ?? {};

  const changes = ((history?.history as Record<string, unknown>[]) ?? []).slice(0, 10).map((h) => ({
    date: h.epochGradeDate instanceof Date ? h.epochGradeDate.toISOString().slice(0, 10) : String(h.epochGradeDate ?? ""),
    firm: String(h.firm ?? ""),
    action: String(h.action ?? ""),
    from: h.fromGrade ? String(h.fromGrade) : null,
    to: h.toGrade ? String(h.toGrade) : null,
  }));

  const lastActionDate = changes.length > 0 ? changes[0].date : null;
  const daysSinceLastAction = lastActionDate
    ? Math.floor((Date.now() - new Date(lastActionDate).getTime()) / 86400_000)
    : null;
  const stalenessWarning = daysSinceLastAction !== null && daysSinceLastAction > 90
    ? `分析师评级已 ${daysSinceLastAction} 天未更新（最后动作：${lastActionDate}），目标价参考价值有限`
    : null;

  return {
    symbol,
    consensus: fin?.recommendationKey as string | null ?? null,
    targetPriceMean: fin?.targetMeanPrice as number | null ?? null,
    targetPriceHigh: fin?.targetHighPrice as number | null ?? null,
    targetPriceLow: fin?.targetLowPrice as number | null ?? null,
    distribution: {
      strongBuy: Number(latest.strongBuy ?? 0),
      buy: Number(latest.buy ?? 0),
      hold: Number(latest.hold ?? 0),
      sell: Number(latest.sell ?? 0),
      strongSell: Number(latest.strongSell ?? 0),
    },
    recentChanges: changes,
    lastActionDate,
    daysSinceLastAction,
    stalenessWarning,
  };
}

// ─── News ─────────────────────────────────────────────────────────────────────

export interface StockNewsItem {
  title: string;
  link: string;
  summary: string;
  pubDate: string;
}

function extractXmlTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

export async function fetchStockNews(symbol: string, limit = 20): Promise<StockNewsItem[]> {
  process.stderr.write(`[yahoo] fetchStockNews symbol=${symbol}\n`);
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=US&lang=en-US`;
  const res = await axios.get<string>(url, { timeout: 8000, responseType: "text" });
  const xml = res.data;

  const items: StockNewsItem[] = [];
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const item of itemMatches.slice(0, limit)) {
    items.push({
      title: extractXmlTag(item, "title"),
      link: extractXmlTag(item, "link") || extractXmlTag(item, "guid"),
      summary: extractXmlTag(item, "description").replace(/<[^>]+>/g, "").slice(0, 200),
      pubDate: extractXmlTag(item, "pubDate"),
    });
  }
  process.stderr.write(`[yahoo] fetchStockNews 返回 ${items.length} 条\n`);
  return items;
}

// ─── Insider Activity ─────────────────────────────────────────────────────────

export interface InsiderTransaction {
  date: string;
  name: string;
  relation: string;
  transactionType: string;
  shares: number | null;
  value: number | null;
  sharesBefore: number | null;
  sharesAfter: number | null;
}

export async function fetchInsiderActivity(symbol: string): Promise<InsiderTransaction[]> {
  process.stderr.write(`[yahoo] fetchInsiderActivity symbol=${symbol}\n`);
  const summary = await yf.quoteSummary(symbol, { modules: ["insiderTransactions"] });
  const raw = summary.insiderTransactions as Record<string, unknown> | undefined;
  const txArr = (raw?.transactions as Record<string, unknown>[]) ?? [];

  return txArr.slice(0, 20).map((tx) => ({
    date: tx.startDate instanceof Date ? tx.startDate.toISOString().slice(0, 10) : String(tx.startDate ?? ""),
    name: String(tx.filerName ?? ""),
    relation: String(tx.filerRelation ?? ""),
    transactionType: String(tx.transactionDescription ?? ""),
    shares: tx.shares as number | null ?? null,
    value: tx.value as number | null ?? null,
    sharesBefore: tx.shareholderBefore as number | null ?? null,
    sharesAfter: tx.shareholderAfter as number | null ?? null,
  }));
}

// ─── Short Interest ───────────────────────────────────────────────────────────

export interface ShortInterest {
  symbol: string;
  sharesShort: number | null;
  sharesShortPriorMonth: number | null;
  shortRatio: number | null;
  shortPercentOfFloat: number | null;
  floatShares: number | null;
  sharesOutstanding: number | null;
  settlementDate: string | null;
  changeFromPriorMonth: number | null;
}

export async function fetchShortInterest(symbol: string): Promise<ShortInterest> {
  process.stderr.write(`[yahoo] fetchShortInterest symbol=${symbol}\n`);
  const summary = await yf.quoteSummary(symbol, {
    modules: ["defaultKeyStatistics"] as never[],
  });
  const stats = summary.defaultKeyStatistics as Record<string, unknown> | undefined;

  const sharesShort = stats?.sharesShort != null ? Number(stats.sharesShort) : null;
  const priorMonth = stats?.sharesShortPriorMonth != null ? Number(stats.sharesShortPriorMonth) : null;
  const change = sharesShort !== null && priorMonth !== null && priorMonth !== 0
    ? Math.round(((sharesShort - priorMonth) / priorMonth) * 10000) / 100
    : null;

  return {
    symbol,
    sharesShort,
    sharesShortPriorMonth: priorMonth,
    shortRatio: stats?.shortRatio != null ? Number(stats.shortRatio) : null,
    shortPercentOfFloat: stats?.shortPercentOfFloat != null
      ? Math.round(Number(stats.shortPercentOfFloat) * 10000) / 100 : null,
    floatShares: stats?.floatShares != null ? Number(stats.floatShares) : null,
    sharesOutstanding: stats?.sharesOutstanding != null ? Number(stats.sharesOutstanding) : null,
    settlementDate: stats?.dateShortInterest instanceof Date
      ? stats.dateShortInterest.toISOString().slice(0, 10) : null,
    changeFromPriorMonth: change,
  };
}

// ─── Market Movers ────────────────────────────────────────────────────────────

export interface MoverItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
  marketCap: number | null;
}

function mapQuoteToMover(q: Record<string, unknown>): MoverItem {
  return {
    symbol: String(q.symbol ?? ""),
    name: String(q.longName ?? q.shortName ?? q.symbol ?? ""),
    price: Number(q.regularMarketPrice ?? 0),
    change: Number(q.regularMarketChange ?? 0),
    changePercent: (Number(q.regularMarketChangePercent ?? 0).toFixed(2)) + "%",
    volume: Number(q.regularMarketVolume ?? 0),
    marketCap: q.marketCap != null ? Number(q.marketCap) : null,
  };
}

export async function fetchMarketMovers(type: "gainers" | "losers" | "actives", count = 20): Promise<MoverItem[]> {
  process.stderr.write(`[yahoo] fetchMarketMovers type=${type} count=${count}\n`);
  const scrIdMap = { gainers: "day_gainers", losers: "day_losers", actives: "most_actives" };
  const result = await (yf as unknown as Record<string, (opts: unknown) => Promise<Record<string, unknown>>>)
    .screener({ scrIds: scrIdMap[type], count, region: "US" });
  const quotes = (result.quotes as Record<string, unknown>[]) ?? [];
  return quotes.slice(0, count).map(mapQuoteToMover);
}

// ─── Dividend History ─────────────────────────────────────────────────────────

export interface DividendInfo {
  symbol: string;
  currentYield: number | null;
  annualDividend: number | null;
  exDividendDate: string | null;
  consecutiveYears: number | null;
  history: { date: string; amount: number }[];
}

export async function fetchDividendHistory(symbol: string): Promise<DividendInfo> {
  process.stderr.write(`[yahoo] fetchDividendHistory symbol=${symbol}\n`);
  const fiveYearsAgo = new Date(Date.now() - 5 * 365 * 86400_000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [summaryResult, histResult] = await Promise.allSettled([
    yf.quoteSummary(symbol, { modules: ["summaryDetail", "defaultKeyStatistics"] }),
    yf.historical(symbol, { period1: fiveYearsAgo, period2: today, events: "dividends" }),
  ]);

  const detail = summaryResult.status === "fulfilled"
    ? summaryResult.value.summaryDetail as Record<string, unknown> | undefined : undefined;

  const history = histResult.status === "fulfilled"
    ? (histResult.value as unknown as { date: Date; dividends: number }[])
        .filter((r) => r.dividends != null)
        .map((r) => ({ date: r.date.toISOString().slice(0, 10), amount: r.dividends }))
        .reverse()
    : [];

  const consecutiveYears = history.length > 0
    ? new Set(history.map((h) => h.date.slice(0, 4))).size : null;

  return {
    symbol,
    currentYield: detail?.dividendYield as number | null ?? null,
    annualDividend: detail?.dividendRate as number | null ?? null,
    exDividendDate: detail?.exDividendDate instanceof Date
      ? detail.exDividendDate.toISOString().slice(0, 10) : null,
    consecutiveYears,
    history,
  };
}

// ─── Institutional Holders ────────────────────────────────────────────────────

export interface InstitutionalHolder {
  organization: string;
  pctHeld: number | null;
  shares: number | null;
  value: number | null;
  reportDate: string | null;
}

export async function fetchInstitutionalHolders(symbol: string): Promise<InstitutionalHolder[]> {
  process.stderr.write(`[yahoo] fetchInstitutionalHolders symbol=${symbol}\n`);
  const summary = await yf.quoteSummary(symbol, {
    modules: ["institutionOwnership"] as never[],
  });
  const ownership = summary.institutionOwnership as Record<string, unknown> | undefined;
  const holders = (ownership?.ownershipList as Record<string, unknown>[]) ?? [];
  return holders.slice(0, 10).map((h) => ({
    organization: String(h.organization ?? ""),
    pctHeld: h.pctHeld != null ? Math.round(Number(h.pctHeld) * 10000) / 100 : null,
    shares: h.position != null ? Number(h.position) : null,
    value: h.value != null ? Number(h.value) : null,
    reportDate: h.reportDate instanceof Date ? h.reportDate.toISOString().slice(0, 10) : null,
  }));
}

// ─── Similar Stocks ───────────────────────────────────────────────────────────

export interface SimilarStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: string;
  marketCap: number | null;
  pe: number | null;
  sector: string | null;
}

export async function fetchSimilarStocks(symbol: string): Promise<SimilarStock[]> {
  process.stderr.write(`[yahoo] fetchSimilarStocks symbol=${symbol}\n`);
  const recs = await (yf as unknown as Record<string, (sym: string) => Promise<Record<string, unknown>>>)
    .recommendedSymbols(symbol);
  const symbols: string[] = ((recs.recommendedSymbols as Record<string, unknown>[]) ?? [])
    .slice(0, 8)
    .map((r) => String(r.symbol ?? ""))
    .filter(Boolean);

  if (symbols.length === 0) return [];

  const quotes = await fetchUSQuotes(symbols);
  const profiles = await Promise.allSettled(
    symbols.map((s) => yf.quoteSummary(s, { modules: ["price", "summaryProfile"] }))
  );

  return quotes.map((q, i) => {
    const p = profiles[i];
    const profile = p.status === "fulfilled"
      ? p.value.summaryProfile as Record<string, unknown> | undefined : undefined;
    const price = p.status === "fulfilled"
      ? p.value.price as Record<string, unknown> | undefined : undefined;
    return {
      symbol: q.symbol,
      name: q.name,
      price: q.price,
      changePercent: q.changePercent,
      marketCap: price?.marketCap != null ? Number(price.marketCap) : q.marketCap,
      pe: price?.trailingPE != null ? Number(price.trailingPE) : null,
      sector: profile?.sector ? String(profile.sector) : null,
    };
  });
}

// ─── US Market Scan ───────────────────────────────────────────────────────────

import { SP500_SYMBOLS } from "./sp500";

export interface MarketScanResult {
  topVolumeRatio: USQuote[];
  topGainers: USQuote[];
  topLosers: USQuote[];
  scannedCount: number;
}

export async function fetchUsMarketScan(topN = 20): Promise<MarketScanResult> {
  process.stderr.write(`[yahoo] fetchUsMarketScan count=${SP500_SYMBOLS.length}\n`);

  // 分批并行，每批100只
  const BATCH = 100;
  const batches: string[][] = [];
  for (let i = 0; i < SP500_SYMBOLS.length; i += BATCH) {
    batches.push(SP500_SYMBOLS.slice(i, i + BATCH));
  }
  const batchResults = await Promise.all(batches.map((b) => fetchUSQuotes(b)));
  const all = batchResults.flat().filter((q) => q.price > 0);

  const byVolumeRatio = [...all]
    .filter((q) => q.volumeRatio != null)
    .sort((a, b) => (b.volumeRatio ?? 0) - (a.volumeRatio ?? 0))
    .slice(0, topN);

  const byGain = [...all]
    .sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent))
    .slice(0, topN);

  const byLoss = [...all]
    .sort((a, b) => parseFloat(a.changePercent) - parseFloat(b.changePercent))
    .slice(0, topN);

  return {
    topVolumeRatio: byVolumeRatio,
    topGainers: byGain,
    topLosers: byLoss,
    scannedCount: all.length,
  };
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
