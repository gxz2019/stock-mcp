/**
 * 测试 data/tencent.ts
 * 运行：npx ts-node test/data-tencent.ts
 */
import {
  fetchAShareQuotes,
  fetchHKQuotes,
  fetchAShareKline,
  fetchHKKline,
  resolveASharePrefix,
} from "../src/data/tencent";

function section(title: string) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(50));
}

async function main() {
  // ── 1. 代码前缀识别 ───────────────────────────────
  section("resolveASharePrefix");
  const cases = [
    ["600519", "sh"], // 上证（茅台）
    ["000858", "sz"], // 深证（五粮液）
    ["301060", "sz"], // 创业板
    ["688001", "sh"], // 科创板
    ["830001", "bj"], // 北交所
    ["sh600519", "sh"], // 带前缀
  ];
  for (const [code, expected] of cases) {
    const got = resolveASharePrefix(code);
    const ok = got === expected ? "✓" : "✗";
    console.log(`  ${ok}  ${code.padEnd(12)} → ${got}  (expected ${expected})`);
  }

  // ── 2. A 股行情 ───────────────────────────────────
  section("fetchAShareQuotes — 茅台 + 五粮液");
  try {
    const quotes = await fetchAShareQuotes(["600519", "000858"]);
    for (const q of quotes) {
      console.log(`  ${q.name}(${q.code})  价格=${q.price}  涨跌=${q.change}  涨跌幅=${q.changePercent}`);
    }
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 3. A 股错误代码 ───────────────────────────────
  section("fetchAShareQuotes — 错误代码");
  try {
    const quotes = await fetchAShareQuotes(["999999"]);
    console.log("  返回:", quotes.length === 0 ? "空数组（符合预期）" : JSON.stringify(quotes));
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 4. 港股行情 ───────────────────────────────────
  section("fetchHKQuotes — 腾讯 + 阿里巴巴");
  try {
    const quotes = await fetchHKQuotes(["00700", "09988"]);
    for (const q of quotes) {
      console.log(`  ${q.name}(${q.code})  价格=${q.price}  涨跌幅=${q.changePercent}`);
    }
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 5. A 股 K 线 ──────────────────────────────────
  section("fetchAShareKline — 茅台日K");
  try {
    const bars = await fetchAShareKline("600519", "daily");
    const last = bars[bars.length - 1];
    console.log(`  共 ${bars.length} 条`);
    console.log(`  最新一条: date=${last?.date}  open=${last?.open}  close=${last?.close}  high=${last?.high}  low=${last?.low}`);
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 6. 港股 K 线 ──────────────────────────────────
  section("fetchHKKline — 腾讯日K");
  try {
    const bars = await fetchHKKline("00700", "daily");
    const last = bars[bars.length - 1];
    console.log(`  共 ${bars.length} 条`);
    console.log(`  最新一条: date=${last?.date}  open=${last?.open}  close=${last?.close}`);
  } catch (e) {
    console.error("  ERROR:", e);
  }
}

main().catch(console.error);
