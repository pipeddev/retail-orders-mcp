import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BUSINESS_INFO } from "../business-info.ts";

export function registerBusinessInfo(server: McpServer) {
  server.registerResource(
    "business-info",
    "business://info",
    {
      title: "Información del negocio",
      description:
        "Horario, dirección, medios de pago y despacho de la ferretería",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(BUSINESS_INFO, null, 2),
        },
      ],
    }),
  );
}
