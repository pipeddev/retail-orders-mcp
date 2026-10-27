import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@retail-orders-mcp/shared";
import { connectAs, textOf } from "./helpers.ts";

type Conn = Awaited<ReturnType<typeof connectAs>>;

afterAll(async () => {
  await pool.end();
});

describe("orders-server como Camila (cliente 1)", () => {
  let conn: Conn;

  beforeAll(async () => {
    conn = await connectAs(1);
  });

  afterAll(async () => {
    await conn.close(); // ← solo cierra el cliente MCP, ya no el pool
  });

  // ---------- Contrato: lo que el modelo ve en tools/list ----------

  it("expone las tools esperadas", async () => {
    const { tools } = await conn.client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      ["get_order_status", "list_my_orders", "search_orders"].sort(),
    );
  });

  it("ninguna tool acepta customerId como argumento (ADR-2)", async () => {
    const { tools } = await conn.client.listTools();
    for (const tool of tools) {
      const props = Object.keys(tool.inputSchema.properties ?? {});
      expect(props.map((p) => p.toLowerCase())).not.toContain("customerid");
    }
  });

  it("todas las tools tienen descripción y son de solo lectura", async () => {
    const { tools } = await conn.client.listTools();
    for (const tool of tools) {
      expect(tool.description?.length).toBeGreaterThan(40);
      expect(tool.annotations?.readOnlyHint).toBe(true);
    }
  });

  // ---------- list_my_orders ----------

  it("list_my_orders devuelve solo los 3 pedidos de Camila", async () => {
    const result = await conn.client.callTool({
      name: "list_my_orders",
      arguments: {},
    });
    const { orders } = result.structuredContent as { orders: { id: number }[] };

    expect(result.isError).toBeFalsy();
    expect(orders.map((o) => o.id).sort()).toEqual([1040, 1042, 1044]);
  });

  it("list_my_orders filtra por estado", async () => {
    const result = await conn.client.callTool({
      name: "list_my_orders",
      arguments: { status: "shipped" },
    });
    const { orders } = result.structuredContent as { orders: { id: number }[] };

    expect(orders.map((o) => o.id)).toEqual([1042]);
  });

  // ---------- search_orders ----------

  it.each([
    ["1042", 1042],
    ["mi pedido del taladro", 1042],
    ["pintura", 1040],
  ])('search_orders("%s") encuentra el pedido %i', async (text, expectedId) => {
    const result = await conn.client.callTool({
      name: "search_orders",
      arguments: { text },
    });
    const { order } = result.structuredContent as { order: { id: number } };

    expect(result.isError).toBeFalsy();
    expect(order.id).toBe(expectedId);
  });

  it.each([
    ["1043", "pedido de otro cliente"],
    ["escalera", "producto que compró otro cliente"],
    ["hola", "sin palabras útiles"],
    ["pedido", "solo stopwords"],
  ])('search_orders("%s") no encuentra nada: %s', async (text) => {
    const result = await conn.client.callTool({
      name: "search_orders",
      arguments: { text },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("No encontré");
    // No debe filtrar datos de otros clientes en el texto
    expect(textOf(result)).not.toMatch(/Diego|Escalera tijera/);
  });

  // ---------- get_order_status ----------

  it("get_order_status(1042) responde estado, total y productos", async () => {
    const result = await conn.client.callTool({
      name: "get_order_status",
      arguments: { orderId: 1042 },
    });
    const text = textOf(result);

    expect(text).toContain("en despacho");
    expect(text).toContain("43.970");
    expect(text).toContain("Taladro Bosch 500W");
  });

  it("get_order_status rechaza un número inválido sin tocar la base", async () => {
    // Según la versión del SDK, la validación de Zod llega como excepción
    // o como resultado con isError. Aceptamos ambas.
    try {
      const result = await conn.client.callTool({
        name: "get_order_status",
        arguments: { orderId: -5 },
      });
      expect(result.isError).toBe(true);
    } catch (err) {
      expect(String(err)).toMatch(/invalid|validation/i);
    }
  });

  it("expone las políticas como resource", async () => {
    const result = await conn.client.readResource({ uri: "orders://policies" });
    const first = result.contents[0] as { text?: string };

    expect(first.text).toContain("Cancelaciones");
  });

  it("el prompt /seguimiento incluye el pedido y las políticas", async () => {
    const result = await conn.client.getPrompt({
      name: "seguimiento",
      arguments: { orderId: "1042" },
    });

    expect(result.messages).toHaveLength(2);
    const instructions = result.messages[0]!.content as {
      type: string;
      text: string;
    };
    expect(instructions.text).toContain("1042");
    expect(result.messages[1]!.content.type).toBe("resource");
  });

  it("el autocompletado solo sugiere pedidos de Camila", async () => {
    const result = await conn.client.complete({
      ref: { type: "ref/prompt", name: "seguimiento" },
      argument: { name: "orderId", value: "104" },
    });

    expect(result.completion.values.sort()).toEqual(["1040", "1042", "1044"]);
  });
});

describe("orders-server como Diego (cliente 2)", () => {
  it("Diego sí ve el pedido 1043", async () => {
    const conn = await connectAs(2);
    const result = await conn.client.callTool({
      name: "search_orders",
      arguments: { text: "1043" },
    });
    const { order } = result.structuredContent as { order: { id: number } };

    expect(order.id).toBe(1043);
    await conn.close();
  });
});
