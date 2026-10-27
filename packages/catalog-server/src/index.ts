import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { pool } from "@retail-orders-mcp/shared";
import { createCatalogServer } from "./server.ts";

const server = createCatalogServer();
await server.connect(new StdioServerTransport());
console.error("catalog-server listo (stdio)");

const shutdown = async () => {
  await server.close();
  await pool.end();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
