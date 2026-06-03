# xstock-mcp

基于 MCP 协议的股票与加密货币分析服务器，支持美股、加密货币、A股和港股。

## 功能

- **美股** — 实时行情、K线数据、公司简介、主要指数（标普500、纳斯达克、道琼斯、罗素2000、VIX）
- **加密货币** — 市场概况、恐惧贪婪指数、市值排名、赛道分类、永续合约资金费率
- **A股 & 港股** — 腾讯财经实时行情
- **股票搜索** — 按名称或代码搜索任意标的

## 工具列表

| 工具 | 说明 |
|------|------|
| `get_quote` | 实时报价（美股 / 加密货币 / A股 / 港股） |
| `get_kline` | K线数据，支持日线 / 周线 / 月线 |
| `search_stock` | 按关键词搜索股票和加密货币 |
| `get_us_indices` | 美国主要市场指数 |
| `get_stock_profile` | 公司基本面信息 |
| `get_crypto_overview` | 全球加密市场总市值 + 恐惧贪婪指数 |
| `get_crypto_top` | 按市值排名的 Top N 币种 |
| `get_crypto_categories` | 加密货币赛道分类（DeFi、Layer1、AI、GameFi…） |
| `get_funding_rate` | Binance 永续合约资金费率 |

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
