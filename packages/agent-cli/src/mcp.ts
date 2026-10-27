import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from "@modelcontextprotocol/sdk/client/stdio.js";

const root = (p: string) =>
  fileURLToPath(new URL(`../../../${p}`, import.meta.url));

export async function connectOrdersServer(customerId: number) {
  // El host LANZA el servidor como proceso hijo y le habla por stdin/stdout.
  // Aquí se inyecta la identidad del cliente: el modelo nunca la ve.
  const transport = new StdioClientTransport({
    command: root("node_modules/.bin/tsx"),
    args: [root("packages/orders-server/src/index.ts")],
    env: {
      ...getDefaultEnvironment(), // PATH, HOME, etc.
      DATABASE_URL: process.env.DATABASE_URL!,
      CUSTOMER_ID: String(customerId),
    },
    stderr: "ignore", // los logs del servidor no ensucian el chat
  });

  const client = new Client({ name: "agent-cli", version: "0.0.1" });
  await client.connect(transport); // hace initialize + initialized

  return client;
}
