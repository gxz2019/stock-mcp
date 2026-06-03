import axios from "axios";
import iconv from "iconv-lite";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AShareQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: string;
  volume: string;
  marketCap: string;
}

export interface HKQuote {
  code: string;
  name: string;
  price: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  volume: string;
  change: number;
  changePercent: string;
  time: string;
}

export interface KlineBar {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

// ─── URL Builders ─────────────────────────────────────────────────────────────

function aQuoteUrl(code: string) {
  return `https://qt.gtimg.cn/q=s_${resolveASharePrefix(code)}${code}`;
}

function hkQuoteUrl(code: string) {
  return `https://qt.gtimg.cn/q=r_hk${code}`;
}

function aKlineUrl(code: string, period: string) {
  return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${resolveASharePrefix(code)}${code},${period},,,100,qfq`;
}

function hkKlineUrl(code: string, period: string) {
  return `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=hk${code},${period},,,100,qfq`;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

// 6/5 开头=上证，8/9 开头=北交所，其余=深证
export function resolveASharePrefix(code: string): "sh" | "sz" | "bj" {
  const c = code.replace(/^(sh|sz|bj)/i, "");
  if (/^[56]/.test(c)) return "sh";
  if (/^[89]/.test(c)) return "bj";
  return "sz";
}

function periodParam(period: "daily" | "weekly" | "monthly"): string {
  return { daily: "day", weekly: "week", monthly: "month" }[period];
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseAShareQuote(raw: string, code: string): AShareQuote | null {
  const match = raw.match(/v_s_\w+="([^"]+)"/);
  if (!match) return null;
  const f = match[1].split("~");
  return {
    code,
    name: f[1],
    price: parseFloat(f[3]),
    change: parseFloat(f[4]),
    changePercent: f[5] + "%",
    volume: f[6],
    marketCap: f[9],
  };
}

function parseHKQuote(raw: string, code: string): HKQuote | null {
  const match = raw.match(/v_r_hk\w+="([^"]+)"/);
  if (!match) return null;
  const f = match[1].split("~");
  return {
    code,
    name: f[1],
    price: parseFloat(f[3]),
    prevClose: parseFloat(f[4]),
    open: parseFloat(f[5]),
    volume: f[6],
    time: f[30],
    change: parseFloat(f[31]),
    changePercent: f[32] + "%",
    high: parseFloat(f[33]),
    low: parseFloat(f[34]),
  };
}

function parseKline(data: unknown, key: string): KlineBar[] {
  const d = data as Record<string, unknown>;
  const dataMap = d?.["data"] as Record<string, unknown> | undefined;
  const stockData = (dataMap?.[key] ?? {}) as Record<string, unknown>;
  const raw = (stockData?.["qfqday"] ?? stockData?.["day"] ?? []) as string[][];
  return raw.slice(-100).map((k) => ({
    date: k[0],
    open: parseFloat(k[1]),
    close: parseFloat(k[2]),
    high: parseFloat(k[3]),
    low: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

// ─── Fetch Functions ──────────────────────────────────────────────────────────

export async function fetchAShareQuotes(codes: string[]): Promise<AShareQuote[]> {
  process.stderr.write(`[tencent] fetchAShareQuotes codes=${codes.join(",")}\n`);
  const results = await Promise.all(
    codes.map(async (raw) => {
      const code = raw.replace(/^(sh|sz|bj)/i, "");
      try {
        const res = await axios.get(aQuoteUrl(code), { timeout: 5000, responseType: "arraybuffer" });
        const text = iconv.decode(Buffer.from(res.data), "gbk");
        const quote = parseAShareQuote(text, code);
        if (!quote) process.stderr.write(`[tencent] A股解析失败 code=${code}\n`);
        return quote;
      } catch (e) {
        process.stderr.write(`[tencent] A股请求失败 code=${code} err=${e}\n`);
        return null;
      }
    })
  );
  return results.filter(Boolean) as AShareQuote[];
}

export async function fetchHKQuotes(codes: string[]): Promise<HKQuote[]> {
  process.stderr.write(`[tencent] fetchHKQuotes codes=${codes.join(",")}\n`);
  const results = await Promise.all(
    codes.map(async (raw) => {
      const code = raw.replace(/^hk/i, "").padStart(5, "0");
      try {
        const res = await axios.get(hkQuoteUrl(code), { timeout: 5000, responseType: "arraybuffer" });
        const text = iconv.decode(Buffer.from(res.data), "gbk");
        const quote = parseHKQuote(text, code);
        if (!quote) process.stderr.write(`[tencent] 港股解析失败 code=${code}\n`);
        return quote;
      } catch (e) {
        process.stderr.write(`[tencent] 港股请求失败 code=${code} err=${e}\n`);
        return null;
      }
    })
  );
  return results.filter(Boolean) as HKQuote[];
}

export async function fetchAShareKline(
  code: string,
  period: "daily" | "weekly" | "monthly" = "daily"
): Promise<KlineBar[]> {
  const stripped = code.replace(/^(sh|sz|bj)/i, "");
  const prefix = resolveASharePrefix(stripped);
  process.stderr.write(`[tencent] fetchAShareKline code=${stripped} period=${period}\n`);
  const res = await axios.get(aKlineUrl(stripped, periodParam(period)), { timeout: 5000 });
  const bars = parseKline(res.data, `${prefix}${stripped}`);
  process.stderr.write(`[tencent] fetchAShareKline 返回 ${bars.length} 条\n`);
  return bars;
}

export async function fetchHKKline(
  code: string,
  period: "daily" | "weekly" | "monthly" = "daily"
): Promise<KlineBar[]> {
  const normalized = code.replace(/^hk/i, "").padStart(5, "0");
  process.stderr.write(`[tencent] fetchHKKline code=${normalized} period=${period}\n`);
  const res = await axios.get(hkKlineUrl(normalized, periodParam(period)), { timeout: 5000 });
  const bars = parseKline(res.data, `hk${normalized}`);
  process.stderr.write(`[tencent] fetchHKKline 返回 ${bars.length} 条\n`);
  return bars;
}
