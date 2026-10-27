import Anthropic from "@anthropic-ai/sdk";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SYSTEM_PROMPT } from "./prompt.ts";
import { logToolCall } from "./log.ts";

const MODEL = "claude-haiku-5-5";
const MAX_ITERATIONS = 8; // tope de vueltas por mensaje: evita loops infinitos

type Message = Anthropic.MessageParam;

export class Agent {
  private anthropic = new Anthropic(); // lee ANTHROPIC_API_KEY
  private history: Message[] = [];
  private tools: Anthropic.Tool[] = [];
  usage = { input: 0, output: 0 };

  constructor(private mcp: Client) {}

  // Traduce las tools MCP al formato de tools de la API de Anthropic.
  // El JSON Schema que generó Zod en tu servidor pasa tal cual.
  async init() {
    const { tools } = await this.mcp.listTools();
    this.tools = tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
    }));
    return this.tools.map((t) => t.name);
  }

  async send(userText: string): Promise<string> {
    this.history.push({ role: "user", content: userText });

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      // 1. El LLM decide: responder o pedir tools
      const response = await this.anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: this.tools,
        messages: this.history,
      });

      this.usage.input += response.usage.input_tokens;
      this.usage.output += response.usage.output_tokens;
      this.history.push({ role: "assistant", content: response.content });

      // 2. Si no pidió tools, terminamos: es la respuesta final
      if (response.stop_reason !== "tool_use") {
        return response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n");
      }

      // 3. El LLM PROPUSO tools; el host las EJECUTA (puede pedir varias a la vez)
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        results.push(await this.executeTool(block));
      }

      // 4. Los resultados vuelven al LLM como un mensaje "user"
      this.history.push({ role: "user", content: results });
    }

    return "Disculpa, no pude resolver tu consulta. ¿Puedes reformularla?";
  }

  private async executeTool(
    block: Anthropic.ToolUseBlock,
  ): Promise<Anthropic.ToolResultBlockParam> {
    const started = Date.now();
    let text: string;
    let isError: boolean;

    try {
      const result = await this.mcp.callTool({
        name: block.name,
        arguments: block.input as Record<string, unknown>,
      });

      // Al modelo solo le pasamos el TEXTO (content).
      // structuredContent es para el host: aquí no lo usamos, en la fase 4 sí.
      const content = result.content as Array<{ type: string; text?: string }>;
      text = content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n");
      isError = Boolean(result.isError);
    } catch (err) {
      // Errores de protocolo (validación de Zod, servidor caído): también vuelven al modelo
      text = `Error al ejecutar ${block.name}: ${(err as Error).message}`;
      isError = true;
    }

    logToolCall({
      ts: new Date().toISOString(),
      tool: block.name,
      input: block.input,
      isError,
      ms: Date.now() - started,
      output: text,
    });

    return {
      type: "tool_result",
      tool_use_id: block.id,
      content: text,
      is_error: isError,
    };
  }
}
