import { query } from "@retail-orders-mcp/shared";

export interface Product {
  sku: string;
  name: string;
  category: string;
  price_clp: number;
  description: string;
}

const STOPWORDS = new Set([
  "tienen",
  "tienes",
  "hay",
  "quiero",
  "busco",
  "necesito",
  "algun",
  "algún",
  "alguna",
  "para",
  "precio",
  "cuanto",
  "cuánto",
  "vale",
  "cuesta",
]);

function toPatterns(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
    .map((w) => `%${w}%`);
}

export async function searchProducts(
  text: string,
  limit: number,
): Promise<Product[]> {
  const patterns = toPatterns(text);
  if (patterns.length === 0) return [];

  // Ranking simple: cuántas palabras del texto coinciden con nombre o categoría
  return query<Product>(
    `SELECT sku, name, category, price_clp, description
       FROM products p
      WHERE p.name ILIKE ANY($1::text[])
         OR p.category ILIKE ANY($1::text[])
         OR p.description ILIKE ANY($1::text[])
      ORDER BY (
        SELECT count(*) FROM unnest($1::text[]) AS pat
         WHERE p.name ILIKE pat OR p.category ILIKE pat
      ) DESC, p.name
      LIMIT $2`,
    [patterns, limit],
  );
}

export async function getProduct(sku: string): Promise<Product | null> {
  const [product] = await query<Product>(
    `SELECT sku, name, category, price_clp, description FROM products WHERE sku = $1`,
    [sku],
  );
  return product ?? null;
}

export async function getStock(sku: string): Promise<number | null> {
  const [row] = await query<{ available: number }>(
    `SELECT available FROM stock WHERE sku = $1`,
    [sku],
  );
  return row?.available ?? null;
}

export async function listCategories(): Promise<
  { category: string; products: number }[]
> {
  return query(
    `SELECT category, count(*)::int AS products FROM products GROUP BY category ORDER BY category`,
  );
}

export async function listSkus(): Promise<{ sku: string; name: string }[]> {
  return query(`SELECT sku, name FROM products ORDER BY name`);
}
