import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getProduct, getStock } from "../catalog.service.ts";

export function registerCheckStock(server: McpServer) {
  server.registerTool(
    "check_stock",
    {
      title: "Consultar stock",
      description:
        "Indica cuántas unidades disponibles hay de un producto, a partir de su SKU exacto " +
        '(por ejemplo "TAL-500"). Si no conoces el SKU, primero usa search_products.',
      inputSchema: {
        sku: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z0-9-]{3,20}$/, "SKU con formato inválido")
          .describe("SKU del producto, por ejemplo TAL-500"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ sku }) => {
      const product = await getProduct(sku);
      if (!product) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No existe un producto con SKU ${sku}. Búscalo con search_products.`,
            },
          ],
        };
      }

      const available = (await getStock(sku)) ?? 0;
      const text =
        available > 0
          ? `${product.name} (${sku}): ${available} unidades disponibles.`
          : `${product.name} (${sku}): sin stock por ahora.`;

      return {
        content: [{ type: "text", text }],
        structuredContent: { sku, name: product.name, available },
      };
    },
  );
}
