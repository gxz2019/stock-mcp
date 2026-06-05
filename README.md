# xstock-mcp

基于 MCP 协议的股票与加密货币分析服务器，支持美股、加密货币、A股和港股。

## 功能

- **美股** — 实时行情、K线数据、公司简介、主要指数（标普500、纳斯达克、道琼斯、罗素2000、VIX）
- **加密货币** — 市场概况、恐惧贪婪指数、市值排名、赛道分类、永续合约资金费率
- **A股 & 港股** — 腾讯财经实时行情
- **股票搜索** — 按名称或代码搜索任意标的

## 工具列表

### 美股

| 工具 | 说明 |
|------|------|
| `get_quote` | 实时行情，含盘前 / 盘后价格及涨跌幅 |
| `get_kline` | K线数据，支持日线 / 周线 / 月线 |
| `get_kline_with_indicators` | K线 + MA5/10/20/60、RSI14、MACD、布林带（精确计算） |
| `get_us_indices` | 主要指数：标普500、纳斯达克、道琼斯、罗素2000、VIX |
| `get_us_sector_heatmap` | 11大行业板块今日涨跌（SPDR ETF） |
| `get_us_market_scan` | 扫描 S&P 500 全部约500只，按量比 / 涨幅 / 跌幅各取 Top N，用于日报选股和热点发现 |
| `get_stock_profile` | 公司基本面：市值、PE、行业、简介 |
| `get_financials` | 财务数据：营收、毛利率、净利润、自由现金流、负债率（年报/季报） |
| `get_analyst_rating` | 分析师评级分布、目标价、近期评级变动（含数据时效性警告） |
| `get_earnings_calendar` | 下次财报日期 + 近4季度 EPS 历史 |
| `get_stock_news` | 个股最新新闻（近7天） |
| `get_insider_activity` | 高管/内部人买卖记录（SEC Form 4） |
| `get_market_movers` | 当日涨幅榜 / 跌幅榜 / 成交量异动榜 |
| `get_dividend_history` | 分红历史、股息率、除息日 |
| `get_institutional_holders` | 前10大机构持仓比例及变动 |
| `get_similar_stocks` | 同行业可比公司估值对比 |
| `get_short_interest` | 做空比例、空头回补天数、与上月对比 |
| `get_stock_full_overview` | 复合工具：行情 + 基本面 + 评级 + 新闻，一次返回 |
| `search_stock` | 按名称或代码搜索 |

### 加密货币

| 工具 | 说明 |
|------|------|
| `get_crypto_overview` | 全球市值 + 恐惧贪婪指数 |
| `get_crypto_top` | 按市值排名的 Top N 币种 |
| `get_crypto_categories` | 赛道分类（DeFi、Layer1、AI、GameFi…） |
| `get_funding_rate` | Binance 永续合约资金费率 |
| `get_crypto_liquidation` | 合约市场情绪：OI、多空比、吃单比 |

### A股 / 港股

| 工具 | 说明 |
|------|------|
| `get_quote` | 实时行情（腾讯财经） |
| `get_kline` | K线数据 |

## 使用方法

### Claude Desktop

编辑配置文件：
- macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows：`%APPDATA%\Claude\claude_desktop_config.json`

添加以下内容：

```json
{
  "mcpServers": {
    "xstock-mcp": {
      "command": "npx",
      "args": ["-y", "xstock-mcp"]
    }
  }
}
```

保存后重启 Claude Desktop 即可使用。

### 其他支持 MCP 的客户端（Cursor、OpenClaw 等）

配置方式相同，将上面的 JSON 添加到对应客户端的 MCP 配置文件中。

## 本地开发

```bash
git clone https://github.com/gxz2019/stock-mcp.git
cd stock-mcp
npm install
npm run build
```
