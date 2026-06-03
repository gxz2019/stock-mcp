<div align="right">
  <a href="#english">English</a> | <a href="#中文">中文</a>
</div>

---

## English

A MCP server for stock and crypto market analysis. Supports US stocks, cryptocurrency, A-shares, and Hong Kong stocks.

### Features

- **US Stocks** — real-time quotes, K-line data, company profile, major indices (S&P 500, NASDAQ, Dow Jones, Russell 2000, VIX)
- **Cryptocurrency** — market overview, fear & greed index, top coins by market cap, sector categories, perpetual funding rates
- **A-shares & HK Stocks** — real-time quotes via Tencent Finance
- **Stock Search** — search any symbol by name or ticker

### Tools

| Tool | Description |
|------|-------------|
| `get_quote` | Real-time price quote for US stocks, crypto, A-shares, HK stocks |
| `get_kline` | K-line (OHLCV) data — daily / weekly / monthly |
| `search_stock` | Search stocks and crypto by keyword |
| `get_us_indices` | Major US market indices |
| `get_stock_profile` | Company profile and fundamentals |
| `get_crypto_overview` | Global crypto market cap + fear & greed index |
| `get_crypto_top` | Top N coins by market cap |
| `get_crypto_categories` | Crypto sector categories (DeFi, Layer1, AI, GameFi…) |
| `get_funding_rate` | Binance perpetual contract funding rates |

### Installation

```bash
npx stock-mcp
```

Or install globally:

```bash
npm install -g stock-mcp
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

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

### Development

```bash
git clone https://github.com/gxz2019/stock-mcp.git
cd stock-mcp
npm install
npm run build
```

---

## 中文

股票与加密货币市场分析的 MCP 服务器，支持美股、加密货币、A股和港股。

### 功能特性

- **美股** — 实时行情、K线数据、公司简介、主要指数（标普500、纳斯达克、道琼斯、罗素2000、VIX）
- **加密货币** — 市场概况、恐惧贪婪指数、市值排名、赛道分类、永续合约资金费率
- **A股 & 港股** — 通过腾讯财经获取实时行情
- **股票搜索** — 按名称或代码搜索任意标的

### 工具列表

| 工具 | 说明 |
|------|------|
| `get_quote` | 美股、加密货币、A股、港股实时报价 |
| `get_kline` | K线数据（OHLCV），支持日线/周线/月线 |
| `search_stock` | 按关键词搜索股票和加密货币 |
| `get_us_indices` | 美国主要市场指数 |
| `get_stock_profile` | 公司基本面和简介 |
| `get_crypto_overview` | 全球加密市场总市值 + 恐惧贪婪指数 |
| `get_crypto_top` | 按市值排名的 Top N 币种 |
| `get_crypto_categories` | 加密货币赛道分类（DeFi、Layer1、AI、GameFi…） |
| `get_funding_rate` | Binance 永续合约资金费率 |

### 安装

```bash
npx stock-mcp
```

或全局安装：

```bash
npm install -g stock-mcp
```

### Claude Desktop 配置

在 `claude_desktop_config.json` 中添加：

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

### 本地开发

```bash
git clone https://github.com/gxz2019/stock-mcp.git
cd stock-mcp
npm install
npm run build
```
