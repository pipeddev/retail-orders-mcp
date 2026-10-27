import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { connectOrdersServer } from "./mcp.ts";
import { Agent } from "./agent.ts";

const customerId = Number(process.env.CUSTOMER_ID ?? 1);

console.log(
  `\nFerretería Don Pipe — atención al cliente (cliente ${customerId})`,
);
console.log("Escribe 'salir' para terminar.\n");

const mcp = await connectOrdersServer(customerId);
const agent = new Agent(mcp);
const tools = await agent.init();
console.log(`\x1b[2mTools disponibles: ${tools.join(", ")}\x1b[0m\n`);

const rl = createInterface({ input: stdin, output: stdout });

while (true) {
  const text = (await rl.question("Tú > ")).trim();
  if (!text) continue;
  if (text.toLowerCase() === "salir") break;

  try {
    const answer = await agent.send(text);
    console.log(`\nAgente > ${answer}\n`);
  } catch (err) {
    console.error(`\n[error] ${(err as Error).message}\n`);
  }
}

console.log(
  `\x1b[2mTokens: ${agent.usage.input} entrada, ${agent.usage.output} salida\x1b[0m`,
);
rl.close();
await mcp.close(); // cierra el proceso hijo del servidor
