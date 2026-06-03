/**
 * 测试 data/yahoo.ts
 * 运行：npx ts-node test/data-yahoo.ts
 */
import { fetchUSQuotes, fetchUSKlines, fetchStockProfile } from "../src/data/yahoo";

function section(title: string) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(50));
}

async function main() {
  // ── 1. 美股行情 ───────────────────────────────────
  section("fetchUSQuotes — AAPL / NVDA / TSLA");
  try {
    const quotes = await fetchUSQuotes(["AAPL", "NVDA", "TSLA"]);
    for (const q of quotes) {
      console.log(
        `  ${q.symbol.padEnd(6)} ${q.name.slice(0, 20).padEnd(22)}` +
        `  $${q.price.toFixed(2).padStart(9)}  ${q.changePercent.padStart(8)}` +
        `  ${q.exchange}`
      );
    }
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 2. 错误 symbol ────────────────────────────────
  section("fetchUSQuotes — 不存在的 symbol");
  try {
    const quotes = await fetchUSQuotes(["NOTEXIST999"]);
    console.log("  返回:", quotes.length === 0 ? "空数组（符合预期）" : JSON.stringify(quotes));
  } catch (e) {
    console.log("  捕获到错误（符合预期）:", (e as Error).message);
  }

  // ── 3. 美股日 K 线 ────────────────────────────────
  section("fetchUSKlines — AAPL 最近 30 天日K");
  try {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    const bars = await fetchUSKlines("AAPL", start, end, "1d");
    const last = bars[bars.length - 1];
    console.log(`  共 ${bars.length} 条  (${start} ~ ${end})`);
    console.log(`  最新: date=${last?.date}  open=${last?.open?.toFixed(2)}  close=${last?.close?.toFixed(2)}  adjClose=${last?.adjClose?.toFixed(2)}`);
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 4. 美股周 K 线 ────────────────────────────────
  section("fetchUSKlines — NVDA 最近 3 个月周K");
  try {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
    const bars = await fetchUSKlines("NVDA", start, end, "1wk");
    console.log(`  共 ${bars.length} 条`);
    for (const b of bars.slice(-5)) {
      console.log(`  ${b.date}  close=$${b.close.toFixed(2)}`);
    }
  } catch (e) {
    console.error("  ERROR:", e);
  }

  // ── 5. 股票基本面 ──────────────────────────────────
  section("fetchStockProfile — AAPL");
  try {
    const p = await fetchStockProfile("AAPL");
    console.log(`  名称:     ${p.name}`);
    console.log(`  行业:     ${p.sector} / ${p.industry}`);
    console.log(`  国家:     ${p.country}`);
    console.log(`  市值:     $${p.marketCap ? (p.marketCap / 1e12).toFixed(2) + "T" : "N/A"}`);
    console.log(`  PE:       ${p.pe?.toFixed(2) ?? "N/A"}`);
    console.log(`  EPS:      ${p.eps?.toFixed(2) ?? "N/A"}`);
    console.log(`  Beta:     ${p.beta?.toFixed(2) ?? "N/A"}`);
    console.log(`  52W High: $${p.fiftyTwoWeekHigh?.toFixed(2) ?? "N/A"}`);
    console.log(`  52W Low:  $${p.fiftyTwoWeekLow?.toFixed(2) ?? "N/A"}`);
    console.log(`  网站:     ${p.website ?? "N/A"}`);
  } catch (e) {
    console.error("  ERROR:", e);
  }
}

main().catch(console.error);
