import { appendFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../logs/", import.meta.url));
mkdirSync(dir, { recursive: true });
const file = `${dir}tool-calls.jsonl`;

export interface ToolCallLog {
  ts: string;
  tool: string;
  input: unknown;
  isError: boolean;
  ms: number;
  output: string;
}

export function logToolCall(entry: ToolCallLog) {
  appendFileSync(file, JSON.stringify(entry) + "\n");
  const status = entry.isError ? "\x1b[31merror\x1b[0m" : "\x1b[32mok\x1b[0m";
  // gris tenue en la terminal
  console.log(
    `\x1b[2m  ↳ ${entry.tool} ${JSON.stringify(entry.input)} → ${status} ${entry.ms}ms\x1b[0m`,
  );
}
