import {
  query,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@retail-orders-mcp/shared";

export interface OrderDetail extends Order {
  items: OrderItem[];
}

export interface OrderMatch extends Order {
  products: string;
}

// Palabras que no aportan a la búsqueda
const STOPWORDS = new Set([
  "pedido",
  "pedidos",
  "orden",
  "ordenes",
  "compra",
  "estado",
  "como",
  "cómo",
  "donde",
  "dónde",
  "quiero",
  "saber",
  "tengo",
  "para",
  "esta",
  "está",
]);

export function parseSearchText(text: string) {
  const ids = (text.match(/\d+/g) ?? []).map(Number).filter((n) => n > 0);

  // \p{L} incluye letras con tilde; \W de JS no
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 4 && !/^\d+$/.test(w) && !STOPWORDS.has(w));

  return { ids, patterns: words.map((w) => `%${w}%`) };
}

// El filtro por customer_id está en el SQL: es la regla de autorización.
// Un pedido de otro cliente es indistinguible de uno que no existe.
export async function findOrderForCustomer(
  orderId: number,
  customerId: number,
): Promise<OrderDetail | null> {
  const [order] = await query<Order>(
    `SELECT id, customer_id, status, total_clp,
            eta::text AS eta, created_at::text AS created_at
       FROM orders
      WHERE id = $1 AND customer_id = $2`,
    [orderId, customerId],
  );
  if (!order) return null;

  const items = await query<OrderItem>(
    `SELECT oi.sku, p.name, oi.qty, oi.unit_price_clp
       FROM order_items oi
       JOIN products p ON p.sku = oi.sku
      WHERE oi.order_id = $1
      ORDER BY p.name`,
    [orderId],
  );

  return { ...order, items };
}

export async function listOrdersForCustomer(
  customerId: number,
  status?: OrderStatus,
): Promise<Order[]> {
  return query<Order>(
    `SELECT id, customer_id, status, total_clp,
            eta::text AS eta, created_at::text AS created_at
       FROM orders
      WHERE customer_id = $1
        AND ($2::order_status IS NULL OR status = $2)
      ORDER BY created_at DESC`,
    [customerId, status ?? null],
  );
}

export async function searchOrdersForCustomer(
  customerId: number,
  text: string,
): Promise<OrderMatch[]> {
  const { ids, patterns } = parseSearchText(text);
  if (ids.length === 0 && patterns.length === 0) return [];

  return query<OrderMatch>(
    `SELECT o.id, o.customer_id, o.status, o.total_clp,
            o.eta::text AS eta, o.created_at::text AS created_at,
            string_agg(oi.qty || ' × ' || p.name, ', ' ORDER BY p.name) AS products
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p     ON p.sku = oi.sku
      WHERE o.customer_id = $1
      GROUP BY o.id
     HAVING o.id = ANY($2::int[])
         OR bool_or(p.name ILIKE ANY($3::text[]))
      ORDER BY o.created_at DESC
      LIMIT 5`,
    [customerId, ids, patterns],
  );
}
