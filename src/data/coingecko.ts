import axios from "axios";

const BASE = "https://api.coingecko.com/api/v3";
const FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=1";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlobalMarket {
  totalMarketCapUsd: number;
  totalVolumeUsd: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptos: number;
  marketCapChangePercent24h: number;
}

export interface CoinInfo {
  rank: number;
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
}

export interface CategoryInfo {
  id: string;
  name: string;
  marketCap: number;
  marketCapChange24h: number;
  volume24h: number;
  topCoins: string[];
}

export interface FearGreed {
  value: number;       // 0-100
  label: string;       // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  timestamp: string;
}

// ─── Fetch Functions ──────────────────────────────────────────────────────────

export async function fetchGlobalMarket(): Promise<GlobalMarket> {
  process.stderr.write(`[coingecko] fetchGlobalMarket\n`);
  const res = await axios.get(`${BASE}/global`, { timeout: 8000 });
  const d = res.data.data;
  const result: GlobalMarket = {
    totalMarketCapUsd: d.total_market_cap?.usd ?? 0,
    totalVolumeUsd: d.total_volume?.usd ?? 0,
    btcDominance: parseFloat(d.market_cap_percentage?.btc?.toFixed(2) ?? "0"),
    ethDominance: parseFloat(d.market_cap_percentage?.eth?.toFixed(2) ?? "0"),
    activeCryptos: d.active_cryptocurrencies ?? 0,
    marketCapChangePercent24h: parseFloat(d.market_cap_change_percentage_24h_usd?.toFixed(2) ?? "0"),
  };
  process.stderr.write(`[coingecko] globalMarket btcDominance=${result.btcDominance}%\n`);
  return result;
}

export async function fetchTopCoins(limit: number = 50): Promise<CoinInfo[]> {
  process.stderr.write(`[coingecko] fetchTopCoins limit=${limit}\n`);
  const res = await axios.get(`${BASE}/coins/markets`, {
    timeout: 8000,
    params: {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: limit,
      page: 1,
      sparkline: false,
    },
  });
  const coins: CoinInfo[] = res.data.map((c: Record<string, unknown>, i: number) => ({
    rank: i + 1,
    id: c.id,
    symbol: (c.symbol as string).toUpperCase(),
    name: c.name,
    price: c.current_price,
    changePercent24h: parseFloat(((c.price_change_percentage_24h as number) ?? 0).toFixed(2)),
    marketCap: c.market_cap,
    volume24h: c.total_volume,
  }));
  process.stderr.write(`[coingecko] fetchTopCoins 返回 ${coins.length} 条\n`);
  return coins;
}

export async function fetchCategories(): Promise<CategoryInfo[]> {
  process.stderr.write(`[coingecko] fetchCategories\n`);
  const res = await axios.get(`${BASE}/coins/categories`, { timeout: 8000 });
  const categories: CategoryInfo[] = res.data.map((c: Record<string, unknown>) => ({
    id: c.id,
    name: c.name,
    marketCap: c.market_cap ?? 0,
    marketCapChange24h: parseFloat(((c.market_cap_change_24h as number) ?? 0).toFixed(2)),
    volume24h: c.volume_24h ?? 0,
    topCoins: (c.top_3_coins as string[] | null) ?? [],
  }));
  process.stderr.write(`[coingecko] fetchCategories 返回 ${categories.length} 条\n`);
  return categories;
}

export async function fetchFearGreed(): Promise<FearGreed> {
  process.stderr.write(`[coingecko] fetchFearGreed\n`);
  const res = await axios.get(FEAR_GREED_URL, { timeout: 5000 });
  const d = res.data.data[0];
  const result: FearGreed = {
    value: parseInt(d.value),
    label: d.value_classification,
    timestamp: new Date(parseInt(d.timestamp) * 1000).toISOString().slice(0, 10),
  };
  process.stderr.write(`[coingecko] fearGreed value=${result.value} label=${result.label}\n`);
  return result;
}
