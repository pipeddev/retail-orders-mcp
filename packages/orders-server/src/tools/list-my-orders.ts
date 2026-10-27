import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listOrdersForCustomer } from "../orders.service.ts";
import { formatCLP, STATUS_LABEL } from "@retail-orders-mcp/shared";

export function registerListMyOrders(server: McpServer, customerId: number) {
  server.registerTool(
    "list_my_orders",
    {
      title: "Pedidos del cliente",
      description:
        "Lista los pedidos del cliente actual, del más reciente al más antiguo. Úsala cuando el " +
        "cliente pregunte por sus pedidos sin dar un número, o pregunte cuáles tiene pendientes, " +
        "en despacho, etc. Para el detalle de un pedido usa get_order_status.",
      inputSchema: {
        status: z
          .enum(["pending", "paid", "shipped", "delivered", "cancelled"])
          .optional()
          .describe(
            "Filtra por estado. pending = falta pagar, paid = pagado y en preparación, " +
              "shipped = en despacho, delivered = entregado, cancelled = cancelado. Omitir para ver todos.",
          ),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ status }) => {
      const orders = await listOrdersForCustomer(customerId, status);

      if (orders.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "El cliente no tiene pedidos con ese criterio.",
            },
          ],
          structuredContent: { orders: [] },
        };
      }

      const text = orders
        .map(
          (o) =>
            `- Pedido ${o.id}: ${STATUS_LABEL[o.status]}, total ${formatCLP(o.total_clp)}` +
            (o.eta ? `, entrega ${o.eta}` : ""),
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Pedidos encontrados (${orders.length}):\n${text}`,
          },
        ],
        structuredContent: { orders },
      };
    },
  );
}
