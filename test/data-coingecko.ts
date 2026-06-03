/**
 * 测试 data/coingecko.ts
 * 运行：npx ts-node test/data-coingecko.ts
 *
 * 注意：CoinGecko 免费接口有频率限制，测试时请勿频繁运行
 */
import { fetchGlobalMarket, fetchTopCoins, fetchCategories, fetchFearGreed } from "../src/data/coingecko";

function section(title: string) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(50));
}

async function main() {
  // ── 1. 全市场概况 ─────────────────────────────────
  section("fetchGlobalMarket");
  try {
    const g = await fetchGlobalMarket();
    console.log(`  总市值:    $${(g.totalMarketCapUsd / 1e12).toFixed(2)}T`);
    console.log(`  24h 成交量: $${(g.totalVolumeUsd / 1e9).toFixed(2)}B`);
    console.log(`  BTC 占比:  ${g.btcDominance}%`);
    console.log(`  ETH 占比:  ${g.ethDominance}%`);
    console.log(`  24h 涨跌:  ${g.marketCapChangePercent24h}%`);
    console.log(`  活跃币种:  ${g.activeCryptos}`);
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 2. 市值 Top 10 ───────────────────────────────
  section("fetchTopCoins — Top 10");
  try {
    const coins = await fetchTopCoins(10);
    for (const c of coins) {
      const cap = (c.marketCap / 1e9).toFixed(1);
      console.log(
        `  #${String(c.rank).padEnd(3)} ${c.symbol.padEnd(8)} $${c.price.toFixed(4).padStart(12)}` +
        `  ${c.changePercent24h >= 0 ? "+" : ""}${c.changePercent24h}%  市值=$${cap}B`
      );
    }
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 3. 恐惧贪婪指数 ───────────────────────────────
  section("fetchFearGreed");
  try {
    const fg = await fetchFearGreed();
    console.log(`  指数值: ${fg.value}  状态: ${fg.label}  日期: ${fg.timestamp}`);
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 4. 赛道分类（前 10 条）────────────────────────
  section("fetchCategories — 前 10 个赛道");
  try {
    const cats = await fetchCategories();
    const top10 = cats
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
      .slice(0, 10);
    for (const c of top10) {
      const cap = c.marketCap ? `$${(c.marketCap / 1e9).toFixed(1)}B` : "N/A";
      const chg = c.marketCapChange24h >= 0 ? `+${c.marketCapChange24h}%` : `${c.marketCapChange24h}%`;
      console.log(`  ${c.name.padEnd(30)} 市值=${cap.padStart(10)}  24h=${chg}`);
    }
  } catch (e) {
    console.error("  ERROR:", e);
  }
}

main().catch(console.error);
