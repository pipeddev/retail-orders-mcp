import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listCategories } from "../catalog.service.ts";

export function registerCategories(server: McpServer) {
  server.registerResource(
    "catalog-categories",
    "catalog://categories",
    {
      title: "Categorías del catálogo",
      description: "Categorías de productos y cuántos productos tiene cada una",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const categories = await listCategories();
      const text = categories
        .map((c) => `- ${c.category} (${c.products})`)
        .join("\n");
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Categorías\n\n${text}`,
          },
        ],
      };
    },
  );
}
