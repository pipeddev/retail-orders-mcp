import {
  ResourceTemplate,
  type McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { getProduct, listSkus } from "../catalog.service.ts";
import { formatCLP } from "@retail-orders-mcp/shared";

export function registerProductResource(server: McpServer) {
  server.registerResource(
    "product",
    new ResourceTemplate("catalog://products/{sku}", {
      // list: permite al cliente enumerar todos los recursos concretos del template
      list: async () => {
        const skus = await listSkus();
        return {
          resources: skus.map((p) => ({
            uri: `catalog://products/${p.sku}`,
            name: p.name,
            mimeType: "text/markdown",
          })),
        };
      },
    }),
    {
      title: "Ficha de producto",
      description: "Ficha completa de un producto del catálogo",
      mimeType: "text/markdown",
    },
    async (uri, { sku }) => {
      const product = await getProduct(String(sku).toUpperCase());
      if (!product) {
        throw new Error(`Producto ${sku} no encontrado`);
      }

      const text = [
        `# ${product.name}`,
        `- SKU: ${product.sku}`,
        `- Categoría: ${product.category}`,
        `- Precio: ${formatCLP(product.price_clp)}`,
        "",
        product.description,
      ].join("\n");

      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text }] };
    },
  );
}
