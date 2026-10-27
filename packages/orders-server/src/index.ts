import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { pool } from "@retail-orders-mcp/shared";
import { createOrdersServer } from "./server.ts";

// REGLA DE STDIO: stdout es el canal JSON-RPC. Todo log va a stderr (console.error).

const customerId = Number(process.env.CUSTOMER_ID);
if (!Number.isInteger(customerId) || customerId <= 0) {
  console.error("CUSTOMER_ID inválido o no definido");
  process.exit(1);
}

const server = createOrdersServer(customerId);
const transport = new StdioServerTransport();
await server.connect(transport);

console.error(`orders-server listo (stdio) para el cliente ${customerId}`);

const shutdown = async () => {
  await server.close();
  await pool.end();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);