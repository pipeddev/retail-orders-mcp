import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import { z } from "zod";
import { listOrdersForCustomer } from "../orders.service.ts";
import { ORDER_POLICIES } from "../policies.ts";

export function registerSeguimientoPrompt(
  server: McpServer,
  customerId: number,
) {
  server.registerPrompt(
    "seguimiento",
    {
      title: "Seguimiento de pedido",
      description:
        "Revisa un pedido del cliente y explica su estado y los próximos pasos",
      argsSchema: {
        // Los argumentos de prompts son SIEMPRE strings en MCP.
        // completable() permite al host autocompletar con los pedidos de ESTE cliente.
        orderId: completable(
          z.string().describe("Número del pedido"),
          async (value) => {
            const orders = await listOrdersForCustomer(customerId);
            return orders
              .map((o) => String(o.id))
              .filter((id) => id.startsWith(value));
          },
        ),
      },
    },
    ({ orderId }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Haz el seguimiento del pedido ${orderId} para el cliente.`,
              "1. Consulta el pedido con la tool search_orders.",
              "2. Explica en una o dos frases su estado y la fecha estimada, en tono cercano.",
              "3. Según las políticas adjuntas, di qué puede hacer el cliente ahora (esperar, cancelar o pedir devolución).",
              "4. Si el pedido no existe, no inventes datos: pide que revise el número.",
            ].join("\n"),
          },
        },
        {
          // Resource incrustado: las políticas viajan dentro del prompt
          role: "user",
          content: {
            type: "resource",
            resource: {
              uri: "orders://policies",
              mimeType: "text/markdown",
              text: ORDER_POLICIES,
            },
          },
        },
      ],
    }),
  );
}
