import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchProducts } from "../catalog.service.ts";
import { formatCLP } from "@retail-orders-mcp/shared";

export function registerSearchProducts(server: McpServer) {
  server.registerTool(
    "search_products",
    {
      title: "Buscar productos",
      description:
        "Busca productos del catálogo de la ferretería por nombre, categoría o descripción " +
        '(por ejemplo "taladro", "brocas para concreto", "pintura"). Devuelve SKU, nombre y precio. ' +
        "NO informa stock: para saber si hay unidades disponibles usa check_stock con el SKU.",
      inputSchema: {
        query: z
          .string()
          .trim()
          .min(2)
          .max(100)
          .describe("Qué busca el cliente, en sus palabras"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .default(5)
          .describe("Máximo de resultados"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, limit }) => {
      const products = await searchProducts(query, limit);

      if (products.length === 0) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No hay productos que coincidan con "${query}". Sugiere al cliente otras palabras o revisar las categorías.`,
            },
          ],
        };
      }

      const text = products
        .map((p) => `- ${p.sku}: ${p.name} — ${formatCLP(p.price_clp)}`)
        .join("\n");

      return {
        content: [{ type: "text", text: `Productos encontrados:\n${text}` }],
        structuredContent: { products },
      };
    },
  );
}
