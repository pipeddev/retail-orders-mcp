import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findOrderForCustomer } from "../orders.service.ts";
import { formatCLP, STATUS_LABEL } from "@retail-orders-mcp/shared";

export function registerGetOrderStatus(server: McpServer, customerId: number) {
  server.registerTool(
    "get_order_status",
    {
      title: "Estado de un pedido",
      // La descripción la lee el MODELO: cuándo usarla y cuándo no.
      description:
        "Obtiene el estado, la fecha estimada de entrega, el total y los productos de UN pedido " +
        "del cliente actual, a partir de su número. Úsala cuando el cliente mencione un número de " +
        "pedido concreto. Si no da un número, usa list_my_orders.",
      inputSchema: {
        orderId: z
          .number()
          .int()
          .positive()
          .describe("Número del pedido, por ejemplo 1042"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ orderId }) => {
      const order = await findOrderForCustomer(orderId, customerId);
      console.log("order", order);

      if (!order) {
        // Error de negocio como RESULTADO (isError), no como excepción:
        // el modelo puede leerlo y explicárselo al cliente.
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No encontré el pedido ${orderId} entre los pedidos de este cliente. Pídele que revise el número.`,
            },
          ],
        };
      }

      const items = order.items
        .map(
          (i) => `- ${i.qty} × ${i.name} (${formatCLP(i.unit_price_clp)} c/u)`,
        )
        .join("\n");

      const text = [
        `Pedido ${order.id}: ${STATUS_LABEL[order.status]}.`,
        order.eta
          ? `Entrega estimada: ${order.eta}.`
          : "Sin fecha de entrega estimada.",
        `Total: ${formatCLP(order.total_clp)}.`,
        `Productos:\n${items}`,
      ].join("\n");

      return {
        content: [{ type: "text", text }], // para el modelo
        structuredContent: { order }, // para el host (datos tipados)
      };
    },
  );
}
