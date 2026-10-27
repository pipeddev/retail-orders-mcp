import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createOrdersServer } from "../src/server.ts";

// Conecta un cliente MCP real a tu servidor, sin procesos ni stdio:
// dos transportes enlazados en memoria.
export async function connectAs(customerId: number) {
  const server = createOrdersServer(customerId);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

// Extrae el texto que vería el modelo
export function textOf(
  result: Awaited<ReturnType<Client["callTool"]>>,
): string {
  const content = result.content as Array<{ type: string; text?: string }>;
  return content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");
}
