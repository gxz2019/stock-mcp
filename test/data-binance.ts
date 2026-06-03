/**
 * 测试 data/binance.ts
 * 运行：npx ts-node test/data-binance.ts
 */
import { fetchCryptoTickers, fetchCryptoKlines, normalizeSymbol } from "../src/data/binance";

function section(title: string) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(50));
}

async function main() {
  // ── 1. Symbol 标准化 ──────────────────────────────
  section("normalizeSymbol");
  const cases = ["BTC", "btc", "ETHUSDT", "solUsdt", "PEPE"];
  for (const s of cases) {
    console.log(`  ${s.padEnd(10)} → ${normalizeSymbol(s)}`);
  }

  // ── 2. 多币种行情 ─────────────────────────────────
  section("fetchCryptoTickers — BTC / ETH / SOL");
  try {
    const tickers = await fetchCryptoTickers(["BTC", "ETH", "SOL"]);
    for (const t of tickers) {
      console.log(
        `  ${t.symbol.padEnd(10)}  价格=$${t.price.toLocaleString()}` +
        `  涨跌幅=${t.changePercent}  成交量=${t.volume.toFixed(2)}`
      );
    }
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 3. 错误 symbol ────────────────────────────────
  section("fetchCryptoTickers — 不存在的 symbol");
  try {
    const tickers = await fetchCryptoTickers(["NOTEXIST123"]);
    console.log("  返回:", tickers.length === 0 ? "空数组（符合预期）" : JSON.stringify(tickers));
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 4. BTC 日K ────────────────────────────────────
  section("fetchCryptoKlines — BTC 日K 最近 10 条");
  try {
    const bars = await fetchCryptoKlines("BTC", "1d", 10);
    console.log(`  共 ${bars.length} 条`);
    for (const b of bars) {
      console.log(`  ${b.date}  open=${b.open}  close=${b.close}  vol=${b.volume.toFixed(2)}`);
    }
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 5. ETH 4h K 线 ───────────────────────────────
  section("fetchCryptoKlines — ETH 4h 最近 5 条");
  try {
    const bars = await fetchCryptoKlines("ETH", "4h", 5);
    const last = bars[bars.length - 1];
    console.log(`  共 ${bars.length} 条`);
    console.log(`  最新: date=${last?.date}  close=${last?.close}`);
  } catch (e) {
    console.error("  ERROR:", e);
  }
}

main().catch(console.error);
