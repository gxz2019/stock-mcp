#!/usr/bin/env node
import { startServer } from "./server";

startServer().catch((e) => {
  process.stderr.write(`[stock-mcp] fatal: ${e}\n`);
  process.exit(1);
});
