import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  findOrderForCustomer,
  searchOrdersForCustomer,
} from "../orders.service.ts";
import { formatCLP, STATUS_LABEL } from "@retail-orders-mcp/shared";

export function registerSearchOrders(server: McpServer, customerId: number) {
  server.registerTool(
    "search_orders",
    {
      title: "Buscar pedidos",
      description:
        "Busca pedidos del cliente actual a partir de texto libre: un número de pedido, el nombre " +
        'de un producto que compró, o ambos (por ejemplo "1042", "el del taladro", "pintura blanca"). ' +
        "Úsala cuando el cliente pregunte por un pedido. Si hay un solo resultado devuelve el detalle; " +
        "si hay varios, devuelve la lista para que le preguntes al cliente cuál es.",
      inputSchema: {
        text: z
          .string()
          .trim()
          .min(1)
          .max(200)
          .describe(
            "Lo que el cliente dijo para identificar el pedido: número y/o productos",
          ),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ text }) => {
      console.error(`[search_orders] customer=${customerId} text="${text}"`); // stderr, nunca stdout

      const matches = await searchOrdersForCustomer(customerId, text);

      if (matches.length === 0) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text:
                `No encontré pedidos de este cliente que coincidan con "${text}". ` +
                "Pídele el número de pedido o el nombre de algún producto que compró.",
            },
          ],
        };
      }

      // Un resultado: detalle completo
      if (matches.length === 1) {
        const order = await findOrderForCustomer(matches[0]!.id, customerId);
        if (!order) {
          return {
            isError: true,
            content: [
              { type: "text", text: "El pedido ya no está disponible." },
            ],
          };
        }

        const items = order.items
          .map(
            (i) =>
              `- ${i.qty} × ${i.name} (${formatCLP(i.unit_price_clp)} c/u)`,
          )
          .join("\n");

        const detail = [
          `Pedido ${order.id}: ${STATUS_LABEL[order.status]}.`,
          order.eta
            ? `Entrega estimada: ${order.eta}.`
            : "Sin fecha de entrega estimada.",
          `Total: ${formatCLP(order.total_clp)}.`,
          `Productos:\n${items}`,
        ].join("\n");

        return {
          content: [{ type: "text", text: detail }],
          structuredContent: { order },
        };
      }

      // Varios resultados: el modelo debe preguntar cuál
      const list = matches
        .map(
          (o) =>
            `- Pedido ${o.id} (${STATUS_LABEL[o.status]}, ${formatCLP(o.total_clp)}): ${o.products}`,
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Encontré ${matches.length} pedidos que coinciden. Pregúntale al cliente cuál es:\n${list}`,
          },
        ],
        structuredContent: { orders: matches },
      };
    },
  );
}
