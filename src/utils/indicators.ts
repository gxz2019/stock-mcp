// 技术指标计算，输入均为收盘价数组（时间顺序，oldest first）

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    return round2(sum / period);
  });
}

export function calcEMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < closes.length; i++) {
    if (prev === null) {
      if (i < period - 1) continue;
      // 第一个 EMA 用 SMA 初始化
      const sum = closes.slice(0, period).reduce((a, b) => a + b, 0);
      prev = sum / period;
      result[i] = round2(prev);
    } else {
      prev = closes[i] * k + prev * (1 - k);
      result[i] = round2(prev);
    }
  }
  return result;
}

export function calcRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = round2(100 - 100 / (1 + rs));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const r = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i] = round2(100 - 100 / (1 + r));
  }
  return result;
}

export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

export function calcMACD(closes: number[], fast = 12, slow = 26, signal = 9): MACDResult {
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const macdLine: (number | null)[] = closes.map((_, i) => {
    if (emaFast[i] === null || emaSlow[i] === null) return null;
    return round2((emaFast[i] as number) - (emaSlow[i] as number));
  });

  // signal = EMA9 of macdLine（只对非 null 段计算）
  const signalLine: (number | null)[] = new Array(closes.length).fill(null);
  const histogram: (number | null)[] = new Array(closes.length).fill(null);

  const k = 2 / (signal + 1);
  let prev: number | null = null;
  let count = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) continue;
    count++;
    if (prev === null) {
      if (count < signal) continue;
      // 用前 signal 个 macd 值初始化
      let sum = 0;
      let cnt = 0;
      for (let j = i; j >= 0 && cnt < signal; j--) {
        if (macdLine[j] !== null) { sum += macdLine[j] as number; cnt++; }
      }
      prev = sum / signal;
      signalLine[i] = round2(prev);
    } else {
      prev = (macdLine[i] as number) * k + prev * (1 - k);
      signalLine[i] = round2(prev);
    }
    if (signalLine[i] !== null) {
      histogram[i] = round2((macdLine[i] as number) - (signalLine[i] as number));
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

export interface BOLLResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

export function calcBOLL(closes: number[], period = 20, multiplier = 2): BOLLResult {
  const upper: (number | null)[] = new Array(closes.length).fill(null);
  const middle: (number | null)[] = new Array(closes.length).fill(null);
  const lower: (number | null)[] = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    middle[i] = round2(mean);
    upper[i] = round2(mean + multiplier * std);
    lower[i] = round2(mean - multiplier * std);
  }
  return { upper, middle, lower };
}

export interface BarWithIndicators {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma5: number | null;
  ma10: number | null;
  ma20: number | null;
  ma60: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  bollUpper: number | null;
  bollMiddle: number | null;
  bollLower: number | null;
}

export function attachIndicators(
  bars: { date: string; open: number; high: number; low: number; close: number; volume: number }[]
): BarWithIndicators[] {
  const closes = bars.map((b) => b.close);
  const ma5 = calcMA(closes, 5);
  const ma10 = calcMA(closes, 10);
  const ma20 = calcMA(closes, 20);
  const ma60 = calcMA(closes, 60);
  const rsi14 = calcRSI(closes, 14);
  const macdResult = calcMACD(closes);
  const bollResult = calcBOLL(closes);

  return bars.map((b, i) => ({
    ...b,
    ma5: ma5[i],
    ma10: ma10[i],
    ma20: ma20[i],
    ma60: ma60[i],
    rsi14: rsi14[i],
    macd: macdResult.macd[i],
    macdSignal: macdResult.signal[i],
    macdHist: macdResult.histogram[i],
    bollUpper: bollResult.upper[i],
    bollMiddle: bollResult.middle[i],
    bollLower: bollResult.lower[i],
  }));
}
