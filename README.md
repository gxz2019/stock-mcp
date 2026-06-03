# stock-mcp

A MCP server for stock and crypto market analysis.
股票与加密货币市场分析的 MCP 服务器。

Supports US stocks, cryptocurrency, A-shares, and Hong Kong stocks.
支持美股、加密货币、A股和港股。

---

## Features / 功能特性

- **US Stocks / 美股** — real-time quotes, K-line, company profile, major indices (S&P 500, NASDAQ, Dow Jones, Russell 2000, VIX)
- **Cryptocurrency / 加密货币** — market overview, fear & greed index, top coins, sector categories, perpetual funding rates / 市场概况、恐惧贪婪指数、市值排名、赛道分类、资金费率
- **A-shares & HK Stocks / A股 & 港股** — real-time quotes via Tencent Finance / 腾讯财经实时行情
- **Stock Search / 股票搜索** — search any symbol by name or ticker / 按名称或代码搜索任意标的

## Tools / 工具列表

| Tool | Description / 说明 |
|------|-------------------|
| `get_quote` | Real-time quote — US / crypto / A-share / HK / 实时报价 |
| `get_kline` | K-line data, daily / weekly / monthly / K线数据，日线/周线/月线 |
| `search_stock` | Search stocks and crypto by keyword / 关键词搜索 |
| `get_us_indices` | Major US market indices / 美国主要市场指数 |
| `get_stock_profile` | Company profile and fundamentals / 公司基本面 |
| `get_crypto_overview` | Global crypto market cap + fear & greed / 全球市值 + 恐惧贪婪指数 |
| `get_crypto_top` | Top N coins by market cap / 市值 Top N |
| `get_crypto_categories` | Crypto sector categories (DeFi / Layer1 / AI…) / 赛道分类 |
| `get_funding_rate` | Binance perpetual funding rates / 币安永续资金费率 |

## Installation / 安装

```bash
npx stock-mcp
```

Global install / 全局安装：

```bash
npm install -g stock-mcp
```

## Claude Desktop Configuration / 配置

Add to `claude_desktop_config.json` / 添加到配置文件：

```json
{
  "mcpServers": {
    "stock-mcp": {
      "command": "npx",
      "args": ["-y", "stock-mcp"]
    }
  }
}
```

## Development / 本地开发

```bash
git clone https://github.com/gxz2019/stock-mcp.git
cd stock-mcp
npm install
npm run build
```
