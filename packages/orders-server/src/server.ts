import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetOrderStatus } from "./tools/get-order-status.ts";
import { registerSearchOrders } from "./tools/search-order-status.ts";
import { registerListMyOrders } from "./tools/list-my-orders.ts";
import { registerPoliciesResource } from "./resources/policies.ts";
import { registerSeguimientoPrompt } from "./prompts/seguimiento.ts";

export function createOrdersServer(customerId: number) {
  const server = new McpServer({ name: "orders-server", version: "0.0.1" });

  registerGetOrderStatus(server, customerId);
  registerSearchOrders(server, customerId);
  registerListMyOrders(server, customerId);

  registerPoliciesResource(server);
  registerSeguimientoPrompt(server, customerId);

  return server;
}
