import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ORDER_POLICIES } from "../policies.ts";

export function registerPoliciesResource(server: McpServer) {
  server.registerResource(
    "order-policies",
    "orders://policies",
    {
      title: "Políticas de pedidos",
      description:
        "Estados de pedido, cancelaciones, reembolsos y devoluciones",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        { uri: uri.href, mimeType: "text/markdown", text: ORDER_POLICIES },
      ],
    }),
  );
}
