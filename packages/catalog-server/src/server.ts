import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchProducts } from "./tools/search-products.ts";
import { registerCheckStock } from "./tools/check-stock.ts";
import { registerBusinessInfo } from "./resources/business-info.ts";
import { registerCategories } from "./resources/categories.ts";
import { registerProductResource } from "./resources/product.ts";

export function createCatalogServer() {
  const server = new McpServer({ name: "catalog-server", version: "0.0.1" });

  registerSearchProducts(server);
  registerCheckStock(server);

  registerBusinessInfo(server);
  registerCategories(server);
  registerProductResource(server);

  return server;
}
